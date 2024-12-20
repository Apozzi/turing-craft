import React from 'react';
import './TuringMachineTape.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faChevronLeft, faChevronRight, faTv } from '@fortawesome/free-solid-svg-icons';
import ScreenDisplayModal from '../ScreenDisplayModal/ScreenDisplayModal';
import DigitalNumbersDisplayModal from '../DigitalNumbersDisplayModal/DigitalNumbersDisplayModal';
import { FormattedMessage } from 'react-intl';
import { Subject } from 'rxjs';
import GraphSchematicsManager from '../GraphSchematics/GraphSchematicsManager';

interface TuringMachineTapeProps {
  isPlaying: boolean;
}

interface TuringMachineTapeState {
  isPlaying: boolean;
  tape: string[];
  xTranslation: number;
  headPosition: number;
  isFinished: boolean;
  isAccepted: boolean;
  useEmptyTapeValue: boolean;
}

const initialTapeSize = 1000;
const CACHE_KEY = 'turingConfig';

export default class TuringMachineTape extends React.Component<TuringMachineTapeProps> {
  initialTapeValue = Array(initialTapeSize).fill("0");

  private static tapeSubject = new Subject();
  private zerosToEmpty = (tape: string[]) => tape.map(e => e === "0" ? "" : e);
  private loadFromCache = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } finally {}
      return null;
  };
  
  state : TuringMachineTapeState  = {
    isPlaying: false,
    tape: this.loadFromCache()?.useEmptyTapeValue ? this.zerosToEmpty(this.initialTapeValue): this.initialTapeValue,
    headPosition: 0,
    xTranslation: 0,
    isFinished: false,
    isAccepted: false,
    useEmptyTapeValue: false
  };

  static onTapeChange() {
    return TuringMachineTape.tapeSubject;
  }

  static tapeChange(tape: string[]) {
    TuringMachineTape.tapeSubject.next(tape);
  }

  componentDidMount() {
    TuringMachineTape.tapeSubject.next(this.initialTapeValue)
    GraphSchematicsManager.onChangeHeadPositionAndTape().subscribe(obj => {
      TuringMachineTape.tapeChange(obj.tape);
      this.setState({
        headPosition: obj.headPosition, 
        tape: obj.tape
      });
    });
    GraphSchematicsManager.onChangeStatus().subscribe(status => {
      this.setState({isFinished: status !== "neutral", isAccepted: status === "accepted"});
    })
    GraphSchematicsManager.onChangeConfig().subscribe(config => {
      const { tape } = this.state;
      const newTapeObj = config.useEmptyTapeValue ? this.zerosToEmpty(tape) : this.initialTapeValue
      TuringMachineTape.tapeSubject.next(newTapeObj)
      this.setState({ 
        useEmptyTapeValue: config.useEmptyTapeValue, 
        tape: newTapeObj
      });
    });
  }

  clickLeft() {
    this.setState({xTranslation: this.state.xTranslation-1});
  }

  clickRight() {
    this.setState({xTranslation: this.state.xTranslation+1});
  }

  handleChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    this.setState((prevState: TuringMachineTapeState) => {
      const newTape = [...prevState.tape];
      newTape[index] = newValue;
      return { tape: newTape };
    }, () => TuringMachineTape.tapeSubject.next(this.state.tape));
  };

  render() {
    const {tape, xTranslation, isFinished, isAccepted, useEmptyTapeValue} = this.state;
    const translationSizeInPixels = 400;
    return (
      <div className="turing-machine-tape">
        <ScreenDisplayModal></ScreenDisplayModal>
        <DigitalNumbersDisplayModal></DigitalNumbersDisplayModal>
        <div className="turing-machine-tape--header">
          <div className={'turing-machine-tape--tape-status turing-machine-tape--tape-status-' + (isFinished ? (isAccepted ? "aceito" : "rejeitado"): "neutro") }>
            {
              isFinished ? 
                (isAccepted ? (<FormattedMessage id={'accepted'} />) : <FormattedMessage id={'rejected'} />) : <FormattedMessage id={'neutral'} />
            }
          </div>

          <div className='turing-machine-tape--button-left' onClick={() => this.clickLeft()}>
            <FontAwesomeIcon 
              icon={faChevronLeft} 
              size="lg" 
              className='databar-topbar--icon' />
          </div>
          <div className='turing-machine-tape--button-right' onClick={() => this.clickRight()}>
            <FontAwesomeIcon 
              icon={faChevronRight} 
              size="lg" 
              className='databar-topbar--icon' />
          </div>

          <div className='turing-machine-tape--display' onClick={() => ScreenDisplayModal.openModal({})}>
            <FontAwesomeIcon 
              icon={faTv} 
              style={{marginLeft: '14px'}}
              size="lg" 
              className='databar-topbar--icon' />
          </div>

          <div className='turing-machine-tape--display-2' onClick={() => DigitalNumbersDisplayModal.openModal({})}>
            <FontAwesomeIcon 
              icon={faCalculator} 
              style={{marginLeft: '21px'}}
              size="lg" 
              className='databar-topbar--icon' />
          </div>
        </div>
        <div className="turing-machine-tape--tape" style={{
          transform: "translateX("+ xTranslation * translationSizeInPixels + "px)"
        }}>
          {tape.map((value, index) => (
            <div key={index} className={"turing-machine-tape--tape-item " + (this.props.isPlaying && (this.state.headPosition === index) ? "turing-machine-tape--actual-step" : "")}>
              <div className="turing-machine-tape--index">{index + 2 -tape.length/2}</div>
              <input
                className="turing-machine-tape--tape-item-content"
                value={useEmptyTapeValue && value === "B" ? "" : value}
                onChange={(event) => this.handleChange(index, event)}
              />
          </div>
          ))}
        </div>
      </div>
    );
  }
}