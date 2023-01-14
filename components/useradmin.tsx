import { useState, useContext, Fragment } from 'react';
import store from 'store2';
import {UserContext} from '@/components/Context';
import PersonalEdit from './personaledit';
import lightBoxStyles from '@/styles/lightbox.module.css';
import {UserContextType} from '@/lib/types';

function UserAdmin(){
   const userContext: UserContextType = useContext(UserContext);
   const [personalInfo, setPersonalInfo] = useState(false);

   function closePeronalEdit(){
      setPersonalInfo(false);
   }

   async function signOut(){
      store.remove('user'); 
      userContext.logout();
      const {encryptStorage} = await import('@/lib/encryptStorage');
      encryptStorage.removeItem('token');
   }

   return (userContext &&
      <Fragment>
      {userContext.isLoggedIn &&
      <div style={{padding: '0.5rem'}}>
         Hi! {userContext.user?.name}
         <button className="muted-button button float-right" onClick={() => signOut()}>Sign Out</button>
         <button className="accent-button button float-right" onClick={() => setPersonalInfo(true)}>User Info</button> 
         {personalInfo &&
            <div className={lightBoxStyles.lightbox}>
               <div className={lightBoxStyles.module}>
                  <div className="container">
                     <PersonalEdit closePeronalEdit={closePeronalEdit} />
                  </div>
               </div>
            </div> 
         }
      </div>
      }
      </Fragment>
   );
}


export default UserAdmin;