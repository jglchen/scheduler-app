import { useState, Fragment } from 'react';
import UserLogIn from './userlogin';
import UserAdd from './useradd';
import ForgotPasswd from './forgotpasswd';

function UserAuth(){
    const [signAct, setSignAct] = useState(0);
    const [email, setEmail] = useState('');

    function signActSelect(act: number, em?: string){
      if (typeof em !== 'undefined'){
         setEmail(em);
      }
      setSignAct(act);
    }


    return (
       <Fragment>
         {signAct == 2 &&
            <ForgotPasswd signUpIn={signActSelect} email={email} />
         }
         {signAct == 1 &&
            <UserAdd signUpIn={signActSelect} />
         }
         {signAct == 0 &&
            <UserLogIn signUpIn={signActSelect}  /> 
         }
       </Fragment>
    );
}

export default UserAuth;
