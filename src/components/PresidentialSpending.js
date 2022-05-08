import { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { v4 as uuidv4 } from 'uuid';


const PresidentialSpending = () => {
  const defRef = useRef();
  const surRef = useRef();
  const divRef = useRef();
  const [loaded, setLoaded] = useState(false);
  const [allData, setAllData] = useState([]);
  const [deficit, setDeficit] = useState([]);
  const [surplus, setSurplus] = useState([]);
  const [deficitNodes, setDeficitNodes] = useState([]);
  const [surplusNodes, setSurplusNodes] = useState([]);
  const [width, setWidth] = useState('');
  const [tooltip, setTooltip] = useState(
    {
      president: '',
      debt: '',
      x: 0,
      y: 0,
      party: '',
      debt_peryear: ''
    });
  const [showTooltip, setShowTooltip] = useState(false);
  

  useEffect(() => {
    fetch('/debt.json')
      .then(res => res.json())
      .then((data) => {
        setAllData(data);
        setDeficit([]);
        setSurplus([]);
        data.map((pres) => (
          (+(pres.Debt_change_perc) >= 0) ? 
            setDeficit(prevState => ([...prevState, pres])) :
            setSurplus(prevState => ([...prevState, pres]))
        ))
    })
  }, []);

  //div observer
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      setWidth(Math.floor(entry.contentRect.width));
    }
  })

  useEffect(() => {
    if (defRef.current) {
      resizeObserver.observe(defRef.current);
    }
    return () => {
      resizeObserver.disconnect()
    }
  },[divRef])

  // Size scale for nodes
  const sizeScale = d3.scaleLinear()
    .domain([0, 100])
    .range([10,220])  // between 10 and 100px
  
  function calcRad(n) {
    console.log('calc')
    const area = sizeScale(Number(n));
      if (area < 0) {
        const pos = (area / 3.14) * -1;
        const rad = (Math.sqrt(pos)).toFixed(2)
        return sizeScale(rad);
      }
      else if (area === 0) {
        const rad = 10;
        return sizeScale(rad);
      }
      else {
        const rad = (Math.sqrt(area / (3.14))).toFixed(2)
        return sizeScale(rad);
      }
  }

  useEffect(()=> {
    const defSimulation = d3.forceSimulation()
      // Attraction to the center of the svg area
      .force("center", d3.forceCenter().x(width/2).y(325))
      // Pull / push from each node
      .force("charge", d3.forceManyBody().strength(0.1))
      // Preventing collision no matter how strong the pull by taking account each node's radius
      .force("collision", d3.forceCollide((node) => {
        return (calcRad(node.Debt_change_perc)+0.1)
      }))

    const surSimulation = d3.forceSimulation()
      .force("center", d3.forceCenter().x(width/2).y(325))
      .force("charge", d3.forceManyBody().strength(0))
      .force("collision", d3.forceCollide((node) => {
        return (calcRad(node.Debt_change_perc)+0.1)
      }))

    //add your def / sur array into the simulation nodes
    defSimulation.nodes([...deficit]);
    surSimulation.nodes([...surplus]);

    const simulationDuration = 100;
    let startTime = Date.now();
    let endTime = startTime + simulationDuration;
      
    //on every tick, update state with new simulation nodes
    defSimulation.on("tick", ()=> {
      if (Date.now() < endTime) {
      setDeficitNodes([...defSimulation.nodes()]);
      }
      else {
        defSimulation.stop();
      }
    })

    surSimulation.on("tick", ()=> {
      if (Date.now() < endTime) {
      setSurplusNodes([...surSimulation.nodes()]);
      }
      else {
        surSimulation.stop();
      }
    })

    //unmount simulation
    return () => {
      defSimulation.stop();
      surSimulation.stop();
    }
  }, [deficit, surplus, width]);


  function createFill(party) {
    if (party === "Republican") {
      return '#CC5C55'
    }
    if (party === "Democrat") {
      return '#4584E1'
    }
    else {
      return '#8C939D'
    }
  }

  function handleTooltip(e) {
    setShowTooltip(true);
    const tgtId = e.target.id;
    console.log('ran');

    //find data from data array
    const tgtPres = allData.filter(item => item.id === tgtId);

    //position tooltip
    const xPos = (window.pageXOffset + e.clientX - 110);
    const yPos = (window.pageYOffset + e.clientY - 130);

    setTooltip({
      president: tgtPres[0].President,
      debt: tgtPres[0].Debt_change_perc,
      x: xPos,
      y: yPos,
      party: tgtPres[0].Party,
      debt_peryear: tgtPres[0].Debt_change_percperyear
    });
  }

  const tooltipStyle = {
    position: 'absolute',
    top: tooltip.y,
    left: tooltip.x 
  }

  function abbreviateName(name) {
    let index = '';
    const spaces = name.split(' ').length - 1
    if (spaces === 1) {
      index = name.indexOf(' ');
    }
    else {
      index = name.indexOf(' ',  name.indexOf(' ') + 1);
    }
    const abbreviated = name.slice(index);
    return abbreviated;
  }

  return (
    <section className="Chart">
      <header><h3>Debt by percentage change</h3></header>
      <div className = "Div__wrapper">
      <div className = "Svg__wrapper" ref={divRef}>
        <h5>Presidents who increased debt:</h5>
          <svg preserveAspectRatio="xMinYMin meet" width={width+50} height="100%" className="SVG__deficit" ref={defRef}>
            {deficitNodes.map((pres) => {
              return <g className={pres.Party}
                onMouseEnter={(e)=>handleTooltip(e)}
                onMouseLeave={()=> setShowTooltip(false)}><circle
                className={`Deficit ${pres.Party}`}
                key={uuidv4()}
                id={pres.id}
                cx={pres.x}
                cy={pres.y}
                r={calcRad(pres.Debt_change_perc)}
                fill={createFill(pres.Party)}
              /><text x={pres.x} y={pres.y} className="SVG__text" text-anchor="middle">{abbreviateName(pres.President)}</text></g>
            })}
          </svg>
        </div>
        <div className = "Svg__wrapper">
        <h5>Presidents who reduced debt:</h5>
        <svg width={width} height="100%"  className="SVG__surplus" ref={surRef}>
          {surplusNodes.map((pres) => {
            return <g className={pres.Party} onMouseEnter={(e)=>handleTooltip(e)}
            onMouseLeave={()=>setShowTooltip(false)}><circle 
              className={`Surplus ${pres.Party}`}
              key={uuidv4()}
              id={pres.id}
              cx={pres.x}
              cy={pres.y}
              r={calcRad(pres.Debt_change_perc)}
              fill={createFill(pres.Party)}
            /><text x={pres.x} y={pres.y} className="SVG__text" text-anchor="middle" >{abbreviateName(pres.President)}</text></g>
          })}
        </svg>
        </div>
      </div>
      {showTooltip ? 
        <div className="Tooltip" style={tooltipStyle}>
          <div className="Tooltip__header--wrapper">
            <h6>{tooltip.president}</h6>
            <p>{tooltip.party}</p>
          </div>
          <p className="Tooltip__text">Debt change (%): <span className = "Tooltip__data">{tooltip.debt}%</span></p>
          <p className="Tooltip__text">Change / yr in office (%): <span className = "Tooltip__data">{tooltip.debt_peryear}%</span></p>
        </div>: null}
    </section>
  )
}

export default PresidentialSpending;