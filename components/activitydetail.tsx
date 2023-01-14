import { useState, useEffect, useRef, useContext, FormEvent } from 'react';
import axios from 'axios';
import validator from 'email-validator';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker/dist/entry.nostyle';
import Tooltip from '@mui/material/Tooltip';
import 'material-icons/iconfont/material-icons.css';
import schedulerStyle from '@/styles/scheduler.module.css';
import loaderStyles from '@/styles/loader.module.css';
import {UserContext} from '@/components/Context';
import { getDateString, timezone } from '@/lib/utils';
import {UserContextType, Activity, MeetingTarget} from '@/lib/types';

interface PropsType {
   activityObj: Activity;
   closeActivity: () => void;
   removeActivity: (id: string) => void;
   updateActivity: (data: Activity) => void;
}

function ActivityDetail({activityObj, closeActivity, removeActivity, updateActivity}:PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [inEditing, setInEditing] = useState(false);
    const [inPost, setInPost] = useState(false);
    const [activity, setActivity] = useState<Activity>(activityObj);
    const [titleerr, setTitleErr] = useState('');
    const titleEl = useRef<HTMLInputElement | null>(null);
    const [dateserr, setDatesErr] = useState('');
    const [errDescr, setErrDescr] = useState<string[]>([]);

    useEffect(() => {
       const errDes = [];
       for (let i = 0; i < activity.meetingTargets.length; i++){
          errDes.push('');
       }
       setErrDescr(errDes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);
    
    function changeTitle(e: FormEvent<HTMLInputElement>) {
      const value = e.currentTarget.value.replace(/<\/?[^>]*>/g, "");
      setActivity((prevState) => ({...prevState, title: value}));
    }

    function changeSelectDate(value: Date[]) {
       setActivity((prevState) => ({...prevState, startTime: value[0].getTime()/1000, endTime: value[1].getTime()/1000}));
    }

    function addMeetingTargets() {
      const mTargets = activity.meetingTargets.slice();
      mTargets.push({name:'', email: ''});
      setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
      setErrDescr((prevState) => [...prevState, '']);
    }

    function minusMeetingTargets() {
      const mTargets = activity.meetingTargets.slice();
      const errDes = errDescr.slice();
      mTargets.pop();
      setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
      errDes.pop();
      setErrDescr(errDes);
    }

    function handleMeetingTargetChange(e: FormEvent<HTMLInputElement>, idx: number){
      let {value, name} = e.currentTarget;
      value = value.replace(/<\/?[^>]*>/g, "");
      if (name !== 'name'){
          value = value.trim();
      }
      const mTargets = activity.meetingTargets.slice();
      if (mTargets[idx]){
         if (name === 'name'){
            mTargets[idx] = {...mTargets[idx], name: value};
         }else if (name === 'email'){
            mTargets[idx] = {...mTargets[idx], email: value};
         }
      }
      setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
    }

    function handleSetErrDescr(descr: string, idx: number){
      if (idx>= errDescr.length){
         return;
      }
      const errDes = errDescr.slice();
      errDes[idx] = descr;
      setErrDescr(errDes);
    }

    function changeSendConfirm(bol: boolean){
      setActivity((prevState) => ({...prevState, sendConfirm: bol}));
    }

    function changeDescription(e: FormEvent<HTMLTextAreaElement>){
      const value = e.currentTarget.value.replace(/<\/?[^>]*>/g, "");
      setActivity((prevState) => ({...prevState, description: value}));
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

    function sortOutMeetingTargets() {
      if (!activity.meetingTargets.length){
         return;
      }
      const mTargets: MeetingTarget[] = [];
      const errDes = [];
      for (let i = 0; i < activity.meetingTargets.length; i++){
         if (activity.meetingTargets[i].name.trim()){
            if (!activity.meetingTargets[i].email){
               mTargets.push(activity.meetingTargets[i]);
               errDes.push('');
            }else{
               const target = mTargets.find(item => item.email == activity.meetingTargets[i].email);
               if (!target){
                  mTargets.push(activity.meetingTargets[i]);
                  errDes.push('');
               }
            }
         }
      }
      setActivity((prevState) => ({...prevState, meetingTargets: mTargets}));
      setErrDescr(errDes);
    }  
    
    async function updateGo(){
       //Reset all the err messages
       resetErrMsg();
       //Check if Title is filled
       if (!activity.title.trim()){
         setActivity((prevState) => ({...prevState, title: activity.title.trim()}));
         setTitleErr("Please type title, this field is required!");
         titleEl.current?.focus();
         return;
       }
       //Check if Dates is selected
       if (activity.startTime >= activity.endTime){
         setDatesErr("Starting time of selected range is later than ending time, please reselect!");
         return;
       }
       const currTime = (new Date().getTime()) / 1000;
       if (activity.startTime < currTime || activity.endTime < currTime){
          setDatesErr("We can't set the appointment for the previous time.");
          return;
       }
       if (activity.meetingTargets.length > 0){
         for (let i = 0; i < activity.meetingTargets.length; i++) {
             if (activity.sendConfirm && activity.meetingTargets[i].name.trim()){
                //Check if Email is filled
                if (!activity.meetingTargets[i].email){
                   handleSetErrDescr('You want to send confirmation email, please provide the email', i);
                   return;
                }
             }
             //Validate the email
             if (activity.meetingTargets[i].email && !validator.validate(activity.meetingTargets[i].email)){
                handleSetErrDescr('This email is not validated OK, please enter a legal email.', i);
                return;
             }
         }
       }

       sortOutMeetingTargets();
       const {encryptStorage} = await import('@/lib/encryptStorage');
       const headers = { authorization: `Bearer ${encryptStorage.getItem('token')}` };
       setInPost(true);
       const {data} = await axios.put('/api/updateschedule', {userName: userContext.user.name, timezone, activity, activityObj} , { headers: headers });
       setInPost(false);
       if (data.no_authorization){
          alert("No authorization to update this scheduled activity!");
          return;
       }
       updateActivity(data);
       closeActivity();
    }
 
    async function deleteActivity(){
      if (!userContext){
         return;
      }
      if (!confirm("Are you sure to delete this scheduled activity?")){
        return;
      }
      const {encryptStorage} = await import('@/lib/encryptStorage');
      const headers = { authorization: `Bearer ${encryptStorage.getItem('token')}` };
      setInPost(true);
      const {data} = await axios.delete(`/api/removeschedule/${activityObj.id}`, { data: {...activityObj, userName: userContext.user.name, timezone}, headers: headers  });
      setInPost(false);
      if (data.no_authorization){
         return;
      }
      removeActivity(activityObj.id);
      closeActivity();
    }

    const currTime = (new Date().getTime()) / 1000;   
    if (inEditing && activityObj.startTime >= currTime && activityObj.endTime >= currTime){
    return(
        <div className={schedulerStyle.container}>
            <div className={`${schedulerStyle.container_head} ${'text-center'}`}>
             Update Scheduled Activity
             <Tooltip title="Close" arrow>
                <div className="float-right" style={{cursor: 'pointer'}} onClick={() => closeActivity()}>
                   <span className="material-icons">close</span>
                </div>
             </Tooltip>
          </div>
          <div className={schedulerStyle.container_body}>
             <div className={schedulerStyle.item}>
                <input
                   type="text"
                   name="title"
                   value={activity.title}
                   placeholder="Title"
                   onChange={(e) => changeTitle(e)}
                   ref={titleEl}
               />
               <div className="mark" style={{color: 'red'}}>{titleerr}</div>
              </div>
              <div className={schedulerStyle.item}>
                 <DateTimeRangePicker
                     onChange={(value: Date[]) => changeSelectDate(value)}
                     value={[new Date(activity.startTime*1000), new Date(activity.endTime*1000)]}
                     required={false}
                  />
                 <div className="mark" style={{color: 'red'}}>{dateserr}</div>
              </div>
              <div className={schedulerStyle.item}>
                  Meeting Targets: &nbsp;<Tooltip title="Add meeting targets" arrow><span className="material-icons" style={{verticalAlign: 'middle', cursor: 'pointer'}} onClick={() => addMeetingTargets()}>add_circle</span></Tooltip>
                  {activity.meetingTargets.length > 0 &&
                     <>
                        &nbsp;&nbsp;&nbsp;
                        <Tooltip title="Reduce meeting targets" arrow><span className="material-icons" style={{verticalAlign: 'middle', cursor: 'pointer'}} onClick={() => minusMeetingTargets()}>remove_circle</span></Tooltip>
                     </>
                  }
              </div>
              {activity.meetingTargets.length > 0 &&
                 activity.meetingTargets.map((item, index) => 
                    <div className={schedulerStyle.item} key={index}>
                       <input 
                          type="text" 
                          name="name"
                          placeholder="Name"
                          value={activity.meetingTargets[index].name}
                          onChange={(e) => {handleMeetingTargetChange(e, index)}}
                       />
                       <input 
                          type="text"
                          name="email" 
                          placeholder="Email"
                          value={activity.meetingTargets[index].email}
                          onChange={(e) => handleMeetingTargetChange(e, index)}
                        />
                        <div className="mark" style={{color: 'red'}}>{errDescr[index]}</div>
                   </div>
                 )
              }
              {activity.meetingTargets.length > 0 &&
                 <div className={schedulerStyle.item}>
                     Send Confirmation Emails: &nbsp;
                     <span style={{cursor:'pointer'}} onClick={() => {if (!activity.sendConfirm){changeSendConfirm(true)}}}>
                         <span className="material-icons" style={{verticalAlign: 'middle'}}>{activity.sendConfirm ? 'radio_button_checked': 'radio_button_unchecked'}</span>&nbsp;Yes
                     </span>&nbsp;&nbsp;&nbsp;  
                     <span style={{cursor:'pointer'}} onClick={() => {if (activity.sendConfirm){changeSendConfirm(false)}}}>
                         <span className="material-icons" style={{verticalAlign: 'middle'}}>{activity.sendConfirm ? 'radio_button_unchecked': 'radio_button_checked'}</span>&nbsp;No
                     </span>
                 </div>
              }
              <div className={schedulerStyle.item}>
                  <textarea
                     placeholder="Description"
                     value={activity.description}
                     onChange={(e) => changeDescription(e)}
                  />
              </div>
              <div style={{padding: '0.5rem 0'}}>
                 <button className="button" onClick={updateGo}>Go Update</button>
                 <button className="button" onClick={() => setActivity(activityObj)}>Reset</button>
             </div>
          </div>
           {inPost &&
              <div className={loaderStyles.loadermodal}>
                <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
              </div>
           }
        </div> 
    )
    }
    
    return (
        <div className={schedulerStyle.container}>
          <div className={schedulerStyle.container_head}>
             <Tooltip title="Close" arrow>
                <div className="float-right" style={{marginLeft: '30px', cursor: 'pointer'}} onClick={() => closeActivity()}>
                  <span className="material-icons">close</span>
                </div>
             </Tooltip>
             {userContext &&
             <>
              <Tooltip title="Delete" arrow>
                <div className="float-right" style={{marginLeft: '30px', cursor: 'pointer'}} onClick={() => deleteActivity()}>
                  <span className="material-icons">delete</span>
                </div>
             </Tooltip>
             {activityObj.startTime >= currTime && activityObj.endTime >= currTime &&
             <Tooltip title="Edit" arrow>
             <div className="float-right" style={{marginLeft: '30px', cursor: 'pointer'}} onClick={() => setInEditing(true)}>
               <span className="material-icons">edit</span>
             </div>
             </Tooltip>
             }
             </>   
             }
          </div>
          <div className={schedulerStyle.container_body}>
          {activityObj && 
            <>
              <div className={schedulerStyle.item}>
              {activityObj.title} 
              </div>
              <div className={schedulerStyle.item}>
              {getDateString(activityObj.startTime)} -- {getDateString(activityObj.endTime)}
              </div>
              {activityObj.meetingTargets.length > 0 &&
                <>
                <div className={schedulerStyle.item}>
                  Meeting Targets:
                  {activityObj.meetingTargets.map((item, index) =>
                     <div key={index}>
                       {item.name}{item.email ? ` - ${item.email}`: ''}{item.confirm && <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className={`material-icons ${schedulerStyle.vertical_middle}`}>check</span>accepted</span>}
                     </div>  
                  )}
                </div>
                <div className={schedulerStyle.item}>
                  Send Confirmation Emails:  <span className={`material-icons ${schedulerStyle.vertical_middle}`}>{activityObj.sendConfirm ? 'check_box_outline': 'check_box_outline_blank'}</span>
                </div> 
                </>  
              }
              {activityObj.description &&
                 <div className={schedulerStyle.item}>
                  {activityObj.description}
                 </div>
              }
            </> 
          }   
          </div>
          {inPost &&
              <div className={loaderStyles.loadermodal}>
                <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
              </div>
           }
        </div>
    );    

}


export default ActivityDetail;
