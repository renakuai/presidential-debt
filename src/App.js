import './styles/App.css';
import PresidentialSpending from './components/PresidentialSpending';
import { useRef, useState } from 'react';
import React from 'react';
import * as d3 from 'd3';
import { Outlet } from "react-router-dom";

function App() {

  return (
    <section className="App">
      <header className="App__header"><h1>Visualizing Debt Per US President</h1></header>
      <article className="App__description">
        <header>
          <h5>About</h5>
          <p>Displaying debt per president by total percentage increase / decrease and per year in office.</p>
          <h6 className="Source">Source(s): whitehouse.gov</h6>
        </header>
      </article>
      <main className="Main__app">
        <PresidentialSpending />
      </main>
    </section>
  );
}

export default App;
