import { useState, useRef, useContext, FormEvent } from 'react';
import validator from 'email-validator';
import axios from 'axios';
import store from 'store2';
import loaderStyles from '@/styles/loader.module.css';
import {UserContext} from '@/components/Context';
import {UserContextType} from '@/lib/types';
//import {encryptStorage} from '@/lib/encryptStorage';

interface PropsType {
    signUpIn: (act: number, em?: string) => void;
}

function UserLogIn(props: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const initialState = {
        email: '',
        password: ''
    };
    const [user, setUser] = useState(initialState);
    const [emailerr, setEmailErr] = useState('');
    const emailEl = useRef<HTMLInputElement | null>(null);
    const [passwderr, setPassWdErr] = useState('');
    const passwdEl = useRef<HTMLInputElement | null>(null);
    const [inPost, setInPost] = useState(false);

    function handleChange(e: FormEvent<HTMLInputElement>){
        let { value, name } = e.currentTarget;
        //Remove all the markups to prevent Cross-site Scripting attacks
        value = value.trim().replace(/<\/?[^>]*>/g, "");
        setUser(prevState => ({ ...prevState, [name]: value }));
    }
    
    function resetErrMsg(){
        setEmailErr('');
        setPassWdErr('');
    }
   
    async function submitForm(){
        //Reset all the err messages
        resetErrMsg();
        //Check if Email is filled
        if (!user.email){
           setEmailErr("Please type your email, this field is required!");
           emailEl.current?.focus();
           return;
        }
        //Validate the email
        if (!validator.validate(user.email)){
            setEmailErr("This email is not a legal email.");
            emailEl.current?.focus();
            return;
        }
        //Check if Passwd is filled
        if (!user.password){
            setPassWdErr("Please type your password, this field is required!");
            passwdEl.current?.focus();
            return;
        }
          
        setInPost(true);
        try {
            const submitRes = await axios.post('/api/login', user);
            setInPost(false);
            const {data} = submitRes;
            if (data.no_account){
                setEmailErr("Sorry, we can't find this account.");
                emailEl.current?.focus();
                return;
            }
            if (data.password_error){
                setPassWdErr("Password error");
                passwdEl.current?.focus();
                return;
            }
            const {encryptStorage} = await import('@/lib/encryptStorage');
            
            const {token, ...others} = data;
            const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
            store('user', JSON.stringify(userData));
            encryptStorage.setItem('token', token);
            userContext.login(userData);
            setUser(initialState);
        }catch(err){
            setInPost(false);
            setEmailErr("Failed to log in");
        }
    }

    function resetForm(){
        setUser(initialState);
        resetErrMsg();
    }

    return (userContext &&
        <div className={loaderStyles.container}>
          <h2 className="text-center">Please Log In</h2>
          <form>
             <div className="mark" style={{color: 'red'}}>{emailerr}</div>
             <input
                type="text"
                name="email"
                id="email"
                value={user.email}
                placeholder="Email"
                ref={emailEl}
                onChange={handleChange}    
              />
             <div className="mark" style={{color: 'red'}}>{passwderr}</div>
             <input
                type="password"
                name="password"
                id="password"
                value={user.password}
                placeholder="Password"
                ref={passwdEl}
                onChange={handleChange}    
              />
          </form>
          <div className="text-center"><a onClick={() => {if (props.signUpIn){props.signUpIn(2, user.email)}}}  style={{cursor: 'pointer'}}>Forgot Password?</a></div>
          <input type="button" className="button" value="Log In" onClick={submitForm} /> <input type="button" className="button" value="Reset" onClick={resetForm} /> {props.signUpIn && <button className="muted-button button" onClick={() => props.signUpIn(1)}>Sign Up</button>} 
          {inPost &&
              <div className={loaderStyles.loadermodal}>
                <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
              </div>
          }
        </div>
    );    

}

export default UserLogIn;    