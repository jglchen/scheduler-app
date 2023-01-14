import { useState, useEffect } from 'react';
import axios from 'axios';
import store from 'store2';
import Layout from "@/components/layout";
import UserHead from '@/components/userhead';
import Scheduler from '@/components/scheduler';
import { UserContext } from '@/components/Context';
import {UserContextType, User} from '@/lib/types';

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});

  const login = (user?: User) => {
    if (user && user.id){
      setLoggedIn(true);
      setUserData(user!);
    }  
  };
 
  const logout = () => {
    setLoggedIn(false);
    setUserData({});
  };

  const userContext: UserContextType = {
    isLoggedIn: loggedIn, 
    user: userData, 
    login: login, 
    logout: logout
  };

  useEffect(() => {
    async function fetchUserData() {
      const {encryptStorage} = await import('@/lib/encryptStorage');
      const headers = { authorization: `Bearer ${encryptStorage.getItem('token')}` };
      const { data } = await axios.get('/api/getselfdetail', { headers: headers });
      const {token, ...others} = data;
      const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
      setUserData(userData);
      store('user', JSON.stringify(userData));
      encryptStorage.setItem('token', token);
    }
     
    const user = JSON.parse(store('user'));
    if (user){
      setLoggedIn(true);
      setUserData(user);
        
      const logintime = user.logintime || 0;
      const currTime = Math.round(new Date().getTime() / 1000);
      if (currTime > (logintime + 60 * 60 * 24 * 10)){
        fetchUserData();
      }
    }
  },[]);

  return (
    <div className="container">
       <Layout>
          <UserContext.Provider value={userContext}>
            <UserHead />
            {loggedIn &&
               <Scheduler />
            } 
          </UserContext.Provider>
       </Layout>
    </div>   
  );
}

