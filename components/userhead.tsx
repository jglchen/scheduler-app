import { useContext, Fragment } from 'react';
import {UserContext} from '@/components/Context';
import UserAdmin from './useradmin';
import UserAuth from './userauth';
import {UserContextType} from '@/lib/types';

function UserHead(){
    const userContext: UserContextType = useContext(UserContext);
    return (userContext && 
        <Fragment>
           <h1 className="text-center">
             Welcome to Appointment Scheduler!
           </h1>
           <h5 className="text-right">
             React Native Expo Publish: <a href="https://exp.host/@jglchen/scheduler-app" target="_blank" rel="noreferrer">https://exp.host/@jglchen/scheduler-app</a>
           </h5>           
          {userContext.isLoggedIn ?
             (<UserAdmin />)
             :
             (<UserAuth />)
          }  
        </Fragment>
    )
}

export default UserHead;
