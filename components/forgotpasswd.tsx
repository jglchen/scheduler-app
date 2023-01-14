import { useState, useEffect, useRef, useContext, FormEvent } from 'react';
import validator from 'email-validator';
import passwordValidator from 'password-validator';
import axios from 'axios';
import store from 'store2';
import loaderStyles from '@/styles/loader.module.css';
import {UserContext} from '@/components/Context';
import {UserContextType, PasswdCheck} from '@/lib/types';

interface PropsType {
    email: string;
    signUpIn: (act: number, em?: string) => void;
}

function ForgotPasswd(props: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [email, setEmail] = useState('');
    const [emailerr, setEmailErr] = useState('');
    const emailEl = useRef<HTMLInputElement | null>(null);
    const [checkdata, setCheckdata] = useState<PasswdCheck | null>(null);
    const [numForCheck, setNumForCheck] = useState('');
    const [numchkerr, setNumchkerr] = useState('');
    const numchkEl = useRef<HTMLInputElement | null>(null);
    const [passwd, setPasswd] = useState('');
    const [passwd2, setPasswd2] = useState('');
    const [passwderr, setPassWdErr] = useState('');
    const passwdEl = useRef<HTMLInputElement | null>(null);
    const passwd2El = useRef<HTMLInputElement | null>(null);
    const [inPost, setInPost] = useState(false);

    useEffect(() => {
       if (props.email){
           setEmail(props.email);
       }
    },[props.email]);

    function handleEmailChange(e: FormEvent<HTMLInputElement>){
        let { value } = e.currentTarget;
        //Remove all the markups to prevent Cross-site Scripting attacks
        value = value.trim().replace(/<\/?[^>]*>/g, "");
        setEmail(value);
        setEmailErr('');
    }

    function handleNumberChk(e: FormEvent<HTMLInputElement>){
        let { value } = e.currentTarget;
        //Remove all the markups to prevent Cross-site Scripting attacks
        value = value.trim().replace(/<\/?[^>]*>/g, "");
        setNumForCheck(value);
        setNumchkerr('');
    }
    
    async function submitEmailCheck(){
        //Reset all the err messages
        setEmailErr('');
        //Check if Email is filled
        if (!email){
            setEmailErr("Please type your email, this field is required!");
            emailEl.current?.focus();
            return;
         }
         //Validate the email
         if (!validator.validate(email)){
             setEmailErr("This email is not a legal email.");
             emailEl.current?.focus();
             return;
         }
         
         setInPost(true);
         try {
            const {data} = await axios.post('/api/forgotpasswd', {email});
            setInPost(false);
            if (data.no_account){
               setEmailErr("Sorry, we can't find this account.");
               emailEl.current?.focus();
               return;
            }
            if (data.mail_sent){
               setEmailErr("Email for password reset has been already sent");
            }
            setCheckdata(data);
            setEmailErr('');
         }catch(err){
            setInPost(false);
            setEmailErr("Failed to send the email for password reset");
         }
    }

    function submitNumberCheck(){
        setNumchkerr('');
        if (checkdata && numForCheck != checkdata.numForCheck){
           setNumchkerr('The number you typed is not matched to the figure in the email.');
           numchkEl.current?.focus();
           return;
        }
    }
    
    async function submitPasswdReset(){
        //Reset all the err messages
        setPassWdErr('');

        //Check if Passwd is filled
        if (!passwd || !passwd2){
           setPassWdErr("Please type your password, this field is required!");
           if (!passwd){
              passwdEl.current?.focus();
           }else{
              passwd2El.current?.focus();
           }
           return;
        }
        //Check the passwords typed in the two fields are matched
        if (passwd != passwd2){
           setPassWdErr("Please retype your passwords, the passwords you typed in the two fields are not matched!");
           passwdEl.current?.focus();
           return;
        }

        //Check the validity of password
        let schema = new passwordValidator();
        schema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(2)                                // Must have at least 2 digits
        .has().not().spaces();                          // Should not have spaces
        if (!schema.validate(passwd)){
           setPassWdErr("The password you typed is not enough secured, please retype a new one. The password must have both uppercase and lowercase letters as well as minimum 2 digits.");
           passwdEl.current?.focus();
           return;
        }

        const headers = { authorization: `Bearer ${checkdata?.token}` };
        setInPost(true);
        try {
            const {data} = await axios.post('/api/resetpasswd', {password: passwd}, { headers: headers });
            setInPost(false);
         
            if (data.no_authorization){
                setPassWdErr("No authority to reset password, please resend password reset email");
                return;
            }
            const {encryptStorage} = await import('@/lib/encryptStorage');
            
            const {token, ...others} = data;
            const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
            store('user', JSON.stringify(userData));
            userContext.login(userData);
            encryptStorage.setItem('token', token);
            resetPasswdForm();
        }catch(err){
            setInPost(false);
            setPassWdErr("Faile to reset password");
        }
    }

    function resetPasswdForm(){
        setPasswd('');
        setPasswd2('');
        setPassWdErr('');
    }

    return (
        <div className={loaderStyles.container}>
            <h3 className="text-center">Forgot Password</h3>
            {checkdata &&
             <>
             {numForCheck == checkdata.numForCheck &&
              <>
              <form>
              <div style={{fontSize: '1.25rem', lineHeight: '1.5rem', padding: '0.5rem 0'}}>Please reset your password</div>    
              <input
                type="password"
                value={passwd}
                placeholder="Password"
                ref={passwdEl}
                onChange={(e) => setPasswd(e.target.value.trim())}    
              />
              <div className="mark" style={{color: 'red'}}>{passwderr}</div>
              <input
                type="password"
                value={passwd2}
                placeholder="Please type password again"
                ref={passwd2El}
                onChange={(e) => setPasswd2(e.target.value.trim())}    
               />
              </form>
              <div>
                 <input type="button" className="button" value="Reset Password" onClick={submitPasswdReset} />  <input type="button" className="button" value="Reset" onClick={resetPasswdForm} /> <a onClick={() => {if (props.signUpIn){props.signUpIn(0)}}} style={{cursor: 'pointer'}}>Back to Log In</a>
              </div>
              </>
             }
             {numForCheck != checkdata.numForCheck &&
              <>
              <form>
              <div style={{fontSize: '1.25rem', lineHeight: '1.5rem', padding: '0.5rem 0'}}>Email for password reset has been already sent! Please check the email we sent to you, and type the number in the following.</div>    
              <input
                  type="text"
                  value={numForCheck}
                  placeholder="Please type the number you got in the email"
                  ref={numchkEl}
                  onChange={handleNumberChk}    
              />
             <div className="mark" style={{color: 'red'}}>{numchkerr}</div>
             </form>
              <div>
                 <input type="button" className="button" value="Send" onClick={submitNumberCheck} />  <a onClick={() => {if (props.signUpIn){props.signUpIn(0)}}} style={{cursor: 'pointer'}}>Back to Log In</a>
              </div>
              </>
             }
             </> 
            }
            {!checkdata &&
              <>
              <form>
              <input
                  type="text"
                  name="email"
                  id="email"
                  value={email}
                  placeholder="Email"
                  ref={emailEl}
                  onChange={handleEmailChange}    
              />
              <div className="mark" style={{color: 'red'}}>{emailerr}</div>
              </form>
              <div>
                 <input type="button" className="button" value="Send Password Reset Email" onClick={submitEmailCheck} />  <a onClick={() => {if (props.signUpIn){props.signUpIn(0)}}} style={{cursor: 'pointer'}}>Back to Log In</a>
              </div>
              </>
            }
            {inPost &&
                <div className={loaderStyles.loadermodal}>
                    <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
                </div>
            }
        </div>
    );    

}

export default ForgotPasswd;