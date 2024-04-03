import {BrowserRouter, Routes, Route} from "react-router-dom";

import Header from "./components/Header";
import rutas from "./router/router";

export default function App(){

  const pages = rutas

  rutas.forEach((page, i)=>{
    pages.push(
    <Route path={page.path}  Component={page.component}/>
    );
  })

  return(
    <>
      <Header></Header>
      <BrowserRouter>
        <Routes>
          {
            pages
          }
        </Routes>
      </BrowserRouter>
    </>
  )
}