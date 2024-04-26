import { useState } from 'react'

import './App.css'

import {LoginSocialFacebook} from 'reactjs-social-login';
import { FacebookLoginButton} from "react-social-login-buttons"
import axios from 'axios';
function App() {
const handleResolve= (res)=>{
console.log(res);
axios.post("http://localhost:3000/login",{
  name:res.data.name,
  data:res.data
});
  }
  const handleReject= (res)=>{
    console.log(res,"Rejected");
  }

  return (
    <>
      <LoginSocialFacebook
        appId="720133720049880"
        onResolve={(res) => {
         handleResolve(res);
        }}
        onReject={(res) => {
          handleReject(res);
        }}
      >
        <FacebookLoginButton />
      </LoginSocialFacebook>
    </>
  );
}

export default App
