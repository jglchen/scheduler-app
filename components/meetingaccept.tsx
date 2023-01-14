import { useState, useEffect } from 'react';
import axios from 'axios';
import loaderStyles from '@/styles/loader.module.css';
import { getDateString } from '@/lib/utils';
import { ActivityDetail } from '@/lib/types';

interface PropsType {
   token: string;
   email: string;
}

function MeetingAccept({token, email}: PropsType){
    const [meetingAct, setMeetingAct] = useState<ActivityDetail>();
    const [noMeeting, setNoMeeting] = useState(false);
    const [isInvited, setIsInvited] = useState(false);
    const [acceptConfirm, setAcceptConfirm] = useState(false);
    const [inPost, setInPost] = useState(false);

    useEffect(() => {
        async function fetchData(){
          try {
              const {data} = await axios.post('/api/checkmeetingid', {token});
              if (data.no_meeting){
                  setNoMeeting(true);
                  return;
              }
              setMeetingAct(data);
          }catch(e){
              setNoMeeting(true);
          }
        }
  
        if (token){
          fetchData(); 
        }
    },[token]);

    useEffect(() => {
       if (meetingAct){
          const invitation = meetingAct.meetingTargets.find(item => item.email == email);
          if (invitation){
             setIsInvited(true);
             if (invitation.confirm){
                setAcceptConfirm(true);
             }
          }

       }
    },[meetingAct, email]);

    async function submitConfirm(){
       const headers = { authorization: `Bearer ${token}` };
       setInPost(true);
       const {data} = await axios.post('/api/acceptinvitation', {email, confirm: true}, { headers: headers });
       setInPost(false);
 
       if (data.no_authorization){
          return;
       }
       if (data.accept_invitation){
          setAcceptConfirm(true);
       }
    }
  
    if (!meetingAct){
      return (
        <h4>Please wait...</h4>
      );
   }
   
   if (noMeeting) {
        return (
          <h4>This is an invalid page.</h4>
        );
    }
    
    return (
      <>
      {meetingAct && meetingAct.sendConfirm && isInvited &&
      <div className={loaderStyles.container}>
         <h2 className="text-center">Please Confirm Invitation Acceptance</h2>
         <div>{meetingAct.userName} invited you to join the appointment on {getDateString(meetingAct.startTime)} -- {getDateString(meetingAct.endTime)}.</div>
         <div>
            {!acceptConfirm && 
                <button className="button" onClick={() => submitConfirm()}>Confirm Acceptance</button>
            }
            {acceptConfirm &&
               'You already sent the acceptance confirmation.'
            }
         </div>
         {inPost &&
              <div className={loaderStyles.loadermodal}>
                <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
              </div>
         }
      </div>
      }
      </>
    );
}  

export default MeetingAccept;
