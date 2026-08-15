import React from'react';import ReactDOM from'react-dom/client';import{BrowserRouter}from'react-router-dom';import{Toaster}from'react-hot-toast';import App from'./App';import'./styles/globals.css';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App/>
      <Toaster position="bottom-right" gutter={8} containerStyle={{bottom:80,right:16}}
        toastOptions={{duration:4000,style:{fontFamily:"'Sora',sans-serif",fontSize:'13px',fontWeight:500,borderRadius:'10px',padding:'12px 16px',maxWidth:'340px'},
          success:{style:{background:'#1a7a4a',color:'#fff'}},error:{style:{background:'#c0392b',color:'#fff'}},loading:{style:{background:'#111c17',color:'#fff'}}}}/>
    </BrowserRouter>
  </React.StrictMode>
);
