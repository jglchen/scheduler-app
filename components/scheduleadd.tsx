import { useState, useRef, useContext, FormEvent } from 'react';
import axios from 'axios';
import store from 'store2';
import validator from 'email-validator';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker/dist/entry.nostyle';
import Tooltip from '@mui/material/Tooltip';
import 'material-icons/iconfont/material-icons.css';
import schedulerStyle from '@/styles/scheduler.module.css';
import loaderStyles from '@/styles/loader.module.css';
import {UserContext} from '@/components/Context';
import { timezone } from '@/lib/utils';
import {UserContextType, Activity, MeetingTarget} from '@/lib/types';

interface PropsType {
   closeModal: () => void;
   updateSchedule: (data: Activity[]) => void;
}

function ScheduleAdd({closeModal, updateSchedule}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [title, setTitle] = useState('');
    const [titleerr, setTitleErr] = useState('');
    const titleEl = useRef<HTMLInputElement | null>(null);
    const startTime = new Date();
    const endTime = new Date();
    let startMinutes = Math.ceil((startTime.getMinutes() + 1)/30)*30;
    startTime.setMinutes(startMinutes, 0, 0);
    endTime.setHours(endTime.getHours() + 1, startMinutes, 0, 0);
    const [selectDates, setSelectDates] = useState([startTime, endTime]);
    const [dateserr, setDatesErr] = useState('');
    const [meetingTargets, setMeetingTargets] = useState<MeetingTarget[]>([]);
    const [errDescr, setErrDescr] = useState<string[]>([]);
    const [sendConfirm, setSendConfirm] = useState(false);   
    const [description, setDescription] = useState('');
    const [inPost, setInPost] = useState(false);
    
    function addMeetingTargets() {
       setMeetingTargets((prevState) => [...prevState, {name:'', email: ''}]);
       setErrDescr((prevState) => [...prevState, '']);
    }

    function minusMeetingTargets() {
        const mTargets = meetingTargets.slice();
        const errDes = errDescr.slice();
        mTargets.pop();
        setMeetingTargets(mTargets);
        errDes.pop();
        setErrDescr(errDes);
    }

    function handleMeetingTargetChange(e: FormEvent<HTMLInputElement>, idx: number){
         let {value, name} = e.currentTarget;
         value = value.replace(/<\/?[^>]*>/g, "");
         if (name !== 'name'){
            value = value.trim();
         }
         const mTargets = meetingTargets.slice();
         if (mTargets[idx]){
            if (name === 'name'){
               mTargets[idx] = {...mTargets[idx], name: value};
            }else if (name === 'email'){
               mTargets[idx] = {...mTargets[idx], email: value};
            }
         }
         setMeetingTargets(mTargets);
    }

    function handleSetErrDescr(descr: string, idx: number){
       if (idx>= errDescr.length){
          return;
       }
       const errDes = errDescr.slice();
       errDes[idx] = descr;
       setErrDescr(errDes);
    }

    function sortOutMeetingTargets() {
        if (!meetingTargets.length){
           return;
        }
        const mTargets: MeetingTarget[] = [];
        const errDes = [];
        for (let i = 0; i < meetingTargets.length; i++){
           if (meetingTargets[i].name.trim()){
              if (!meetingTargets[i].email){
                  mTargets.push({name: meetingTargets[i].name.trim(), email: meetingTargets[i].email});
                  errDes.push('');
              }else{
                  const target = mTargets.find(item => item.email == meetingTargets[i].email);
                  if (!target){
                     mTargets.push({name: meetingTargets[i].name.trim(), email: meetingTargets[i].email});
                     errDes.push('');
                  }
              } 
           }
        }
        setMeetingTargets(mTargets);
        setErrDescr(errDes);
    }  

    function resetErrMsg(){
       setTitleErr('');
       setDatesErr('');
       const errDes = [];
       for (let i = 0; i < errDescr.length; i++){
          errDes.push('');
       }
       setErrDescr(errDes);
    }

    async function submitForm(){
       //Reset all the err messages
       resetErrMsg();
       //Check if Title is filled
       if (!title.trim()){
         setTitle(title.trim());
         setTitleErr("Please type title, this field is required!");
         titleEl.current?.focus();
         return;
       }
       //Check if Dates is selected
       if (!selectDates){
          setDatesErr("Please select datetime range, this field is required!");
          return;
       }
       if (selectDates[0] >= selectDates[1]){
          setDatesErr("Starting time of selected range is later than ending time, please reselect!");
          return;
       }
       const currTime = new Date();
       if (selectDates[0] < currTime || selectDates[1] < currTime){
          setDatesErr("We can't set the appointment for the previous time.");
          return;
       }
       if (meetingTargets.length > 0){
          for (let i = 0; i < meetingTargets.length; i++) {
              if (sendConfirm && meetingTargets[i].name.trim()){
                 //Check if Email is filled
                 if (!meetingTargets[i].email){
                    handleSetErrDescr('You want to send confirmation email, please provide the email', i);
                    return;
                 }
              }
              //Validate the email
              if (meetingTargets[i].email && !validator.validate(meetingTargets[i].email)){
                 handleSetErrDescr('This email is not validated OK, please enter a legal email.', i);
                 return;
              }
          }
       }
      
       sortOutMeetingTargets();
       const dataObj = {title: title.trim(), startTime: selectDates[0].getTime()/1000, endTime: selectDates[1].getTime()/1000, meetingTargets, sendConfirm, description, timezone};
       const {encryptStorage} = await import('@/lib/encryptStorage');
       const headers = { authorization: `Bearer ${encryptStorage.getItem('token')}` };
       
       setInPost(true);
       const {data} = await axios.post('/api/addschedule', dataObj, { headers: headers });
       setInPost(false);
       const schedule = JSON.parse(store('schedule')) || [];
       schedule.push(data);
       store('schedule', JSON.stringify(schedule));
       store('schedule_recent', data.created);
       updateSchedule(schedule);
       closeModal();
    } 

    return (userContext &&
      <div className={schedulerStyle.container}>
          <div className={`${schedulerStyle.container_head} ${'text-center'}`}>
             Set Up Scheduled Activity
             <Tooltip title="Close" arrow>
                <div className="float-right" style={{cursor: 'pointer'}} onClick={() => closeModal()}>
                   <span className="material-icons">close</span>
                </div>
             </Tooltip>
          </div>
          <div className={schedulerStyle.container_body}>
              <div className={schedulerStyle.item}>
                <input
                   type="text"
                   name="title"
                   value={title}
                   placeholder="Add Title"
                   onChange={(e) => setTitle(e.target.value.replace(/<\/?[^>]*>/g, ""))}
                   ref={titleEl}
               />
               <div className="mark" style={{color: 'red'}}>{titleerr}</div>
              </div>
              <div className={schedulerStyle.item}>
                 <DateTimeRangePicker
                    onChange={(value: Date[]) => setSelectDates(value)}
                    value={selectDates}
                    required={false}
                  />
                 <div className="mark" style={{color: 'red'}}>{dateserr}</div>
             </div>
              <div className={schedulerStyle.item}>
                  Meeting Targets: &nbsp;<Tooltip title="Add meeting targets" arrow><span className="material-icons" style={{verticalAlign: 'middle', cursor: 'pointer'}} onClick={() => addMeetingTargets()}>add_circle</span></Tooltip>
                  {meetingTargets.length > 0 &&
                     <>
                        &nbsp;&nbsp;&nbsp;
                        <Tooltip title="Reduce meeting targets" arrow><span className="material-icons" style={{verticalAlign: 'middle', cursor: 'pointer'}} onClick={() => minusMeetingTargets()}>remove_circle</span></Tooltip>
                     </>
                  }
              </div>
              {meetingTargets.length > 0 &&
                 meetingTargets.map((item, index) => 
                    <div className={schedulerStyle.item} key={index}>
                       <input 
                          type="text" 
                          name="name"
                          placeholder="Name"
                          value={meetingTargets[index].name}
                          onChange={(e) => {handleMeetingTargetChange(e, index)}}
                       />
                       <input 
                          type="text"
                          name="email" 
                          placeholder="Email"
                          value={meetingTargets[index].email}
                          onChange={(e) => handleMeetingTargetChange(e, index)}
                        />
                        <div className="mark" style={{color: 'red'}}>{errDescr[index]}</div>
                   </div>
                 )
              }
              {meetingTargets.length > 0 &&
                 <div className={schedulerStyle.item}>
                     Send Confirmation Emails: &nbsp;
                     <span style={{cursor:'pointer'}} onClick={() => {if (!sendConfirm){setSendConfirm(true)}}}>
                         <span className="material-icons" style={{verticalAlign: 'middle'}}>{sendConfirm ? 'radio_button_checked': 'radio_button_unchecked'}</span>&nbsp;Yes
                     </span>&nbsp;&nbsp;&nbsp;  
                     <span style={{cursor:'pointer'}} onClick={() => {if (sendConfirm){setSendConfirm(false)}}}>
                         <span className="material-icons" style={{verticalAlign: 'middle'}}>{sendConfirm ? 'radio_button_unchecked': 'radio_button_checked'}</span>&nbsp;No
                     </span>
                 </div>
              }
              <div className={schedulerStyle.item}>
                  <textarea
                     placeholder="Description"
                     value={description}
                     onChange={(e) => setDescription(e.target.value.replace(/<\/?[^>]*>/g, ""))}
                  />
              </div>
              <div style={{padding: '0.5rem 0'}}>
                 <button className="button" onClick={submitForm}>Save</button>
             </div>
           </div>
           {inPost &&
              <div className={loaderStyles.loadermodal}>
                <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
              </div>
           }
      </div> 
    );
} 

export default ScheduleAdd;