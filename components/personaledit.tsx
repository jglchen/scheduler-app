import { useState, useRef, useContext, FormEvent } from 'react';
import axios from 'axios';
import passwordValidator from 'password-validator';
import {UserContext} from '@/components/Context';
import store from 'store2';
import loaderStyles from '@/styles/loader.module.css';
import lightBoxStyles from '@/styles/lightbox.module.css';
import {UserContextType, User} from '@/lib/types';

interface PropsType {
    closePeronalEdit: () => void;
}

function PersonalEdit(props: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [name, setName] = useState('');
    const [nameerr, setNameErr] = useState('');
    const nameEl = useRef<HTMLInputElement | null>(null);
    const [passwd, setPasswd] = useState('');
    const [passwderr, setPasswdErr] = useState('');
    const passwdEl = useRef<HTMLInputElement | null>(null);
    const [updateName, setUpdateName] = useState(false);
    const [updatePasswd, setUpdatePasswd] = useState(false);
    const [inPost, setInPost] = useState(false);
    
    function handleNameChange(e: FormEvent<HTMLInputElement>){
        let { value } = e.currentTarget;
        //Remove all the markups to prevent Cross-site Scripting attacks
        value = value.replace(/<\/?[^>]*>/g, "");
        setName(value);
    }
   
    async function submitNameUpdate(){
        if (name.trim() === userContext.user?.name){
            return;
        }
        setNameErr('');
        //Check if Name is filled
        if (!name.trim()){
           setNameErr("Please type your name, this field is required!");
           nameEl.current?.focus();
           return;
        }

        const {encryptStorage} = await import('@/lib/encryptStorage');
        const headers = { authorization: `Bearer ${encryptStorage.getItem('token')}` };
        setInPost(true);
        try {
            const {data} = await axios.put('/api/updateuser', {name: name.trim()}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setNameErr("No authorization to update");
                nameEl.current?.focus();
                return;
            }
              
            const user = {...userContext.user, name: name} as User;
            store('user', JSON.stringify(user));
            userContext.login(user);
            setUpdateName(false);
        }catch(err){
            setInPost(false);
            setNameErr("Faile to update name");
        }
    }

    async function submitPasswdUpdate(){
        setPasswdErr('');
        //Check if Passwd is filled
        if (!passwd){
           setPasswdErr("Please type your password, this field is required!");
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
            setPasswdErr("The password you typed is not enough secured, please retype a new one. The password must have both uppercase and lowercase letters as well as minimum 2 digits.");
            passwdEl.current?.focus();
            return;
        }
        
        const {encryptStorage} = await import('@/lib/encryptStorage');
        const headers = { authorization: `Bearer ${encryptStorage.getItem('token')}` };
        setInPost(true);
        try {
            const {data} = await axios.put('/api/updateuser', {password: passwd}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setPasswdErr("No authorization to update");
                passwdEl.current?.focus();
                return;
            }
            setUpdatePasswd(false);
        }catch(e){
            setInPost(false);
            setPasswdErr("Failed to update password");
        }
    }    
    
    function closeCallBack(){
       if (props.closePeronalEdit){
        props.closePeronalEdit();
       }
    }
    
    return (
        <div className={loaderStyles.container}>
           <div className={lightBoxStyles.heading}>
               Update My Personal Data
           </div>
           <div>
             <button className="muted-button float-right button" style={{marginRight: '0.5rem'}} onClick={closeCallBack}>Close</button>
           </div>
           {userContext && 
                <table>
                   <tbody>
                       <tr>
                           <td style={{width: '10%'}}>Name:</td>
                           {!updateName &&
                              <>
                                <td>{userContext.user?.name}</td>
                                <td>
                                   <button className="float-right button" onClick={() => {setUpdateName(true); setName(userContext.user.name as string);}}>Update</button>
                                </td>
                             </>
                           }
                           {updateName &&
                              <>
                                <td>
                                   <input type="text" value={name} onChange={(e) => setName(e.target.value.replace(/<\/?[^>]*>/g, ""))} ref={nameEl} />
                                   <div className="mark" style={{color: 'red'}}>{nameerr}</div>
                                </td>
                                <td>
                                   {name.trim() !== userContext.user?.name &&
                                   <>
                                   <button className="float-right button" onClick={() => {setName(userContext.user.name as string);setNameErr('');}}>Reset</button>
                                   <button className="float-right button" onClick={submitNameUpdate}>Go Update</button>
                                   </>
                                  }
                               </td>
                             </>
                           }
                       </tr>

                       <tr>
                           <td style={{width: '10%'}}>Password:</td>
                           {!updatePasswd &&
                              <>
                                <td></td>
                                <td>
                                   <button className="float-right button" onClick={() => {setUpdatePasswd(true);}}>Update</button>
                                </td>
                             </>
                           }
                           {updatePasswd &&
                              <>
                                <td>
                                   <input type="password" value={passwd} onChange={(e) => setPasswd(e.target.value.replace(/<\/?[^>]*>/g, "").trim())} ref={passwdEl} />
                                   <div className="mark" style={{color: 'red'}}>{passwderr}</div>
                                </td>
                                <td>
                                   {passwd &&
                                   <>
                                   <button className="float-right button" onClick={() => {setPasswd('');setPasswdErr('');}}>Reset</button>
                                   <button className="float-right button" onClick={submitPasswdUpdate}>Go Update</button>
                                   </>
                                   }
                               </td>
                             </>
                           }
                       </tr>
                   </tbody>
                </table> 
           }
           {inPost &&
               <div className={loaderStyles.loadermodal}>
                    <div className={`${loaderStyles.loader} ${loaderStyles.div_on_center}`} />
               </div>
           }
        </div>
    );
}

export default PersonalEdit;