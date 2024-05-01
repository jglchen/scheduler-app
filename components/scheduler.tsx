import { useState, useEffect, useRef, useContext } from 'react';
import Calendar from 'react-calendar';
import ReactModal from 'react-modal';
import axios from 'axios';
import store from 'store2';
import ScheduleAdd from './scheduleadd';
import ActivityDetail from './activitydetail';
import 'material-icons/iconfont/material-icons.css';
import schedulerStyle from '@/styles/scheduler.module.css';
import {UserContext} from '@/components/Context';
import {UserContextType, Activity} from '@/lib/types';

type SelectDateType = Date | Date[];

function Scheduler(){
   const userContext: UserContextType = useContext(UserContext);
   const [activities, setActivities] = useState<Activity[]>([]);
   const [currActivities, setCurrActivities] = useState<Activity[]>([]);
   const currDate = new Date();
   currDate.setHours(0, 0, 0, 0);
   const [selectDate, setSelectDate] = useState<any>(currDate);
   const [selectRange, setSelectRange] = useState(false);
   const [showModal, setShowModal] = useState(false);
   const [showActivity, setShowActivity] = useState(false);
   const [activityObj, setActivityObj] = useState<Activity>();
   const homeEl = useRef(null);
    
   useEffect(() => {
      async function fetchData(sch: Activity[]){
         try {
            const {encryptStorage} = await import('@/lib/encryptStorage');
            const headers = { authorization: `Bearer ${encryptStorage.getItem('token')}` };
            const schedule_recent = store('schedule_recent') || '';
            const url = `/api/getactivities?recent=${schedule_recent ? encodeURIComponent(schedule_recent): ''}`;
            const {data} = await axios.get(url, { headers: headers });
            if (data.no_authorization){
               return; 
            }
            const {result, removedact} = data;
            if (!result.length && !removedact.length){
               return; 
            }
          
            let recent = '';
            for (let item of result){
               let idx = sch.findIndex((itm) => itm.id == item.id);
               if (idx > -1){
                  sch[idx] = item;
               }else{
                  sch.push(item);
               }
               recent = item.created;
            }
            const schdl = sch.filter((item) => 
              !removedact.includes(item.id)
            );
            setActivities(schdl);
            store('schedule', JSON.stringify(schdl));
            if (recent){
               store('schedule_recent', recent);
            }
         }catch(e){
            console.error(e);
         }
      }
 
      if (userContext){
         const userId = store('schedule_userid') || '';
         let schedule: Activity[];
         if (userId !== userContext.user?.id){
            store.remove('schedule');
            store.remove('schedule_recent');
            store('schedule_userid', userContext.user?.id);
            schedule = [];
         }else{
            //Set activites from store('schedule')
            schedule = JSON.parse(store('schedule')) || [];
         }
         setActivities(schedule);
         //Fetch recent data from database
         fetchData(schedule);
      }
   },[userContext]);

    useEffect(() => {
       if (selectRange && selectDate instanceof Date){
          const selectDate2 = new Date(selectDate.getTime() + 24 * 60 * 60 * 1000 -1);
          const dateRange = [selectDate, selectDate2];
          setSelectDate(dateRange);
       }else if (!selectRange && !(selectDate instanceof Date)){
          setSelectDate(selectDate[0]);
       }
    },[selectRange, selectDate]);

    useEffect(() => {
      let startDateTime: number;
      let endDateTime: number;
      if (selectDate instanceof Date){
         startDateTime = selectDate.getTime() / 1000;
         endDateTime = startDateTime + 60 * 60 * 24;
      }else{
         startDateTime = selectDate[0].getTime() / 1000;
         endDateTime = (selectDate[1].getTime() + 1) / 1000;
      }
      const selectedAct = activities.filter((item) => 
         (item.startTime > startDateTime && item.endTime < endDateTime) || 
         (item.startTime == startDateTime && item.endTime == endDateTime) || 
         (item.startTime <= startDateTime && item.endTime >= endDateTime) || 
         (item.startTime < startDateTime && item.endTime < endDateTime && item.endTime > startDateTime) || 
         (item.startTime > startDateTime && item.startTime < endDateTime && item.endTime > endDateTime)
      ).sort(function(a, b) {
         if (a.startTime > b.startTime) {
            return 1;
         }else if (a.startTime < b.startTime){
            return -1;
         }else{
            return 0;
         }
      });
      
      setCurrActivities(selectedAct);

    },[selectDate, activities]);

    function closeModal(){
      setShowModal(false);
    }

    function updateSchedule(data: Activity[]){
      setActivities(data);
    }

    function closeActivity(){
      setShowActivity(false);
    }

    function openActivityDetail(item: Activity){
      setActivityObj(item);
      setTimeout(function(){
        setShowActivity(true); 
      }, 0);
    }

    function removeActivity(id: string){
       const sch = activities.slice().filter((item) => item.id != id);
       setActivities(sch);
       store('schedule', JSON.stringify(sch));
    }

    function updateActivity(data: Activity){
       const sch = activities.slice();
       const idx = sch.findIndex(item => item.id == data.id);
       if (idx > -1){
          sch[idx] = data;
          setActivities(sch);
          store('schedule', JSON.stringify(sch));
       }
    }

    function getTileContent({date, view}: {date: Date, view: string}): any{
      if (view !== 'month') {
         return null;
      }
      const startDateTime = date.getTime() / 1000;
      const endDateTime = startDateTime + 60 * 60 * 24;
      const selectedAct = activities.filter((item) => 
         (item.startTime > startDateTime && item.endTime < endDateTime) || (item.startTime == startDateTime && item.endTime < endDateTime) || (item.startTime > startDateTime && item.endTime == endDateTime)
      );
      const selectedRange = activities.filter((item) =>
         (item.startTime <= startDateTime && item.endTime >= endDateTime) 
      );
      const selectedLeftRange = activities.filter((item) =>
         (item.startTime < startDateTime && item.endTime < endDateTime && item.endTime > startDateTime) 
      );
      const selectedRightRange = activities.filter((item) =>
         (item.startTime > startDateTime && item.startTime < endDateTime && item.endTime > endDateTime) 
      );

      let dotColor = 'green';
      let selectClass = schedulerStyle.horizontal_line;
      if (selectDate instanceof Date){
         if (selectDate.getTime() / 1000 == startDateTime){
            dotColor = 'white';
            selectClass = schedulerStyle.horizontal_line_select;
         }
      }else{
         if (selectDate[0].getTime() / 1000 ==  startDateTime || ((selectDate[1].getTime() + 1) / 1000 - 24 * 60 * 60) ==  startDateTime){
            dotColor = 'white';
            selectClass = schedulerStyle.horizontal_line_select;
         }
      }
     
      return ((selectedAct.length > 0 || selectedRange.length > 0 || selectedLeftRange.length > 0 || selectedRightRange.length > 0) &&
        <>
        <div>
          {selectedAct.map((item, index) => <span key={index} style={{color: dotColor}}>&#8226;</span>)}
        </div>
        {selectedRange.map((item, index) =>
          <hr key={index} className={selectClass} />
        )}
        {selectedLeftRange.map((item, index) => {
          const rangeperc = Math.round((item.endTime - startDateTime) / (endDateTime - startDateTime) * 100);
          return <hr key={index} className={`${selectClass} float-left`} style={{width: `${rangeperc}%`}}/>
        })}
        {selectedRightRange.map((item, index) => {
          const rangeperc = Math.round((endDateTime - item.startTime) / (endDateTime - startDateTime) * 100);
          return <hr key={index} className={`${selectClass} float-right`} style={{width: `${rangeperc}%`}}/>
        })}
        </>
      );
    }

    ReactModal.setAppElement(homeEl.current as any);
  
    return (userContext &&
      <div className={schedulerStyle.flex_container} style={{width: '100%'}} ref={homeEl}>  
        <div className={schedulerStyle.flex_item_left}>
          <div>
            <button className="button" onClick={() => setShowModal(true)}>&#65291; Add Activity</button>
          </div>
          <div className='react-calendar'>
            <Calendar 
               onChange={setSelectDate}
               tileContent={({ date, view }) => getTileContent({date, view})}
               value={selectDate}
               selectRange={selectRange}
             />
          </div>
          <div style={{display: 'flex', padding: '0.5rem 0'}}>
             <div className={schedulerStyle.radio_element} onClick={() => {if (selectRange) (setSelectRange(false))}}>
                <span className="material-icons">{selectRange ? 'radio_button_unchecked': 'radio_button_checked'}</span>&nbsp;&nbsp;<div>Pick Single Date</div>
             </div>
             <div className={schedulerStyle.radio_element} onClick={() => {if (!selectRange) (setSelectRange(true))}}>
                <span className="material-icons">{selectRange ? 'radio_button_checked': 'radio_button_unchecked'}</span>&nbsp;&nbsp;<div>Select Range</div>
             </div>
          </div>
        </div>  
        <div className={schedulerStyle.flex_item_right}>
          <h5 className='text-center'>
            {selectDate instanceof Date ? selectDate.toDateString(): `${selectDate[0].toDateString()} -- ${selectDate[1].toDateString()}`}
          </h5>
          {currActivities.length > 0 &&
            <>
            {currActivities.map((item) => {
               const startDate = new Date(item.startTime*1000);
               const endDate = new Date(item.endTime*1000);
               const startDateString = `${startDate.toLocaleDateString('en-US')} ${startDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;
               const endDateString = `${endDate.toLocaleDateString('en-US')} ${endDate.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`;

               return (
                 <div key={item.id}>
                    <div className={schedulerStyle.activity_item} onClick={() => openActivityDetail(item)}>
                    {item.title}<br/>
                    {startDateString} -- {endDateString}
                    </div>
                    <div className={schedulerStyle.activity_space}></div>
                 </div>
                 )
             })}
            </>
          }
       </div>
        <ReactModal 
           isOpen={showModal}
           contentLabel="onRequestClose Modal"
           onRequestClose={() => setShowModal(false)}
           className={schedulerStyle.Modal}
        >
          <ScheduleAdd closeModal={closeModal}
                       updateSchedule={updateSchedule}
                       />
        </ReactModal>
        <ReactModal 
           isOpen={showActivity}
           contentLabel="onRequestClose Modal"
           onRequestClose={() => setShowActivity(false)}
           className={schedulerStyle.Modal}
        >
          <ActivityDetail activityObj={activityObj!} 
                          closeActivity={closeActivity} 
                          removeActivity={removeActivity} 
                          updateActivity={updateActivity} 
                          />
        </ReactModal>
      </div>  
    );

} 

export default Scheduler;