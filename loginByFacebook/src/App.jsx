import { useState } from 'react'

import './App.css'

import {LoginSocialFacebook} from 'reactjs-social-login';
import { FacebookLoginButton} from "react-social-login-buttons"
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <LoginSocialFacebook
        appId="2369283ed2432262"
        onResolve={(res) => {
          console.log(res);
        }}
        onReject={(res) => {
          console.log(res);
        }}
      >
        <FacebookLoginButton />
      </LoginSocialFacebook>
    </>
  );
}

export default App
