import React from 'react';
import Modal from 'react-modal';
import { Subject } from 'rxjs';
import './ConfigurationViewModal.css';
import GraphSchematicsManager from '../GraphSchematics/GraphSchematicsManager';
import toast from 'react-hot-toast';
import { FormattedMessage, injectIntl } from 'react-intl';
import { LOCALES } from '../../i18n/locales';
import { MdFlag } from 'react-icons/md';
import { FaFlagUsa } from 'react-icons/fa';
import App from '../../App';
import { Locale } from '../../i18n/messages';

interface State {
  showModal: boolean;
  speed: number;
  offsetScreenDisplay: number;
  showSoundInfo: boolean;
  language: string;
  useEmptyTapeValue: boolean;
  continueFromStoppedSimulation: boolean;
}

const CACHE_KEY = 'turingConfig';

class ConfigurationViewModal extends React.Component<any, State> {
  static openSubject = new Subject();

  customStyles = {
    content: {
      height: '610px',
      background: 'rgb(42 42 49)',
      border: 'none',
      padding: "0px"
    }
  };

  defaultState: State = {
    showModal: false,
    speed: 1,
    offsetScreenDisplay: 0,
    showSoundInfo: false,
    language: LOCALES.PORTUGUESE,
    useEmptyTapeValue: false,
    continueFromStoppedSimulation: false
  };
  state: State = this.defaultState;

  static openModal(obj: any) {
    this.openSubject.next(obj);
  }

  componentDidMount() {
    Modal.setAppElement('#app');
    const cachedState = this.loadFromCache();
    this.setState(cachedState);
    setTimeout(() => { // Necessário por causa do Subscribes do outros componentes.
      GraphSchematicsManager.setConfig({
        speed: cachedState.speed,
        offsetScreenDisplay: cachedState.offsetScreenDisplay,
        useEmptyTapeValue: cachedState.useEmptyTapeValue
      });
    }, 10);
    GraphSchematicsManager.toggleSongInfo(cachedState.showSoundInfo);
    ConfigurationViewModal.openSubject.subscribe(() => {
      this.setState({ showModal: true });
      GraphSchematicsManager.setPlayOrStop(false);
    });
  }

  loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        return {
          ...this.defaultState,
          ...parsedCache,
          showModal: this.defaultState.showModal
        };
      }
    } catch (error) {
      toast.error('Erro ao carregar cache');
    }
    return this.defaultState;
  };

  saveToCache = (state: Partial<State>) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const currentCache = cached ? JSON.parse(cached) : {};
      const newCache = {
        ...currentCache,
        ...state
      };
      delete newCache.showModal;
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } catch (error) {
      toast.error('Erro ao carregar cache');
    }
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  }

  handleEmptyTapeValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ useEmptyTapeValue: event.target.checked });
  }

  handleContinueFromStoppedSimulationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ continueFromStoppedSimulation: event.target.checked });
  }

  handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(event.target.value);
    this.setState({ speed: newSpeed });
  }
  
  handleOffsetScreenDisplayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseFloat(event.target.value);
    this.setState({ offsetScreenDisplay: newOffset });
  }

  handleShowSoundInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ showSoundInfo: event.target.checked });
  }

  handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    this.setState({ language: newLanguage });
    App.changeLanguage(newLanguage as Locale)
  }

  applyChanges = () => {
    let { speed, offsetScreenDisplay, useEmptyTapeValue, showSoundInfo, language, continueFromStoppedSimulation  } = this.state;
    const { intl } = this.props;
    this.saveToCache({
      speed,
      offsetScreenDisplay,
      useEmptyTapeValue,
      showSoundInfo,
      language,
      continueFromStoppedSimulation
    });
    GraphSchematicsManager.toggleSongInfo(this.state.showSoundInfo);
    GraphSchematicsManager.setConfig({
      speed, offsetScreenDisplay, useEmptyTapeValue, continueFromStoppedSimulation
    });
    toast(intl.formatMessage({ id: 'saved_successfully' }));
    this.handleCloseModal();
  }

  render() {
    return (
      <div>
        <Modal
          isOpen={this.state.showModal}
          contentLabel="Project"
          style={this.customStyles}
          onRequestClose={this.handleCloseModal}
          overlayClassName="overlay"
          className={'content-about'}
        >
          <div className="modal-header">
            <div className="modal-title">
              <FormattedMessage id={"configurations_header"}/>
            </div>
            <div className="modal-close-icon" onClick={this.handleCloseModal}>
              X
            </div>
          </div>

          <div className='modal-content-extra'> 
            {/* Controle de Velocidade */}
            <div className='pad-15'>
              <div className="speed-control">
                <label htmlFor="speed-range"><FormattedMessage id={"speed"}/>:</label>
                <input
                  type="range"
                  id="speed-range"
                  min="0.001"
                  max="100"
                  step="0.5"
                  value={this.state.speed}
                  onChange={this.handleSpeedChange}
                />
                <span>{this.state.speed}x</span>
              </div>
            </div>

            {/* Offset do Display Tela */}
            <div className='pad-15'>
              <div className="offset">
                <label htmlFor="offset"><FormattedMessage id={"offset_screen_display"}/>:</label>
                <input 
                  className="offset-input"
                  type="range"
                  id="offset"
                  min="-2000"
                  max="2000"
                  step="50"
                  value={this.state.offsetScreenDisplay}
                  onChange={this.handleOffsetScreenDisplayChange}
                />
                <span>{this.state.offsetScreenDisplay}+</span>
              </div>
            </div>

            <div className='pad-15'>
              <label className="sound-info-label">
                <input 
                  type="checkbox" 
                  checked={this.state.showSoundInfo} 
                  onChange={this.handleShowSoundInfoChange}
                />
                <span className="switch"></span>
                <div className='switch-text'><FormattedMessage id={"show_sound_info"}/></div>
              </label>
            </div>

            <div className='pad-15'>
              <label className="sound-info-label">
                <input 
                  type="checkbox" 
                  checked={this.state.useEmptyTapeValue} 
                  onChange={this.handleEmptyTapeValueChange}
                />
                <span className="switch"></span>
                <div className='switch-text'><FormattedMessage id={"empty_tape_value_msg_1"}/> <span className="comment">(<FormattedMessage id={"empty_tape_value_msg_2"}/>)</span></div>
              </label>
            </div>

            <div className='pad-15'>
              <label className="sound-info-label">
                <input 
                  type="checkbox" 
                  checked={this.state.continueFromStoppedSimulation} 
                  onChange={this.handleContinueFromStoppedSimulationChange}
                />
                <span className="switch"></span>
                <div className='switch-text'><FormattedMessage id={"continue_from_stopped_simulation"}/></div>
              </label>
            </div>

            {/* Seleção de Idioma */}
            <div className="pad-15">
              <label htmlFor="language-select" className="language-label">
                <FormattedMessage id="select_language" />
              </label>
              <div className="language-select-wrapper">
                <select
                  id="language-select"
                  value={this.state.language}
                  onChange={this.handleLanguageChange}
                  className="language-select"
                >
                  <option value={LOCALES.PORTUGUESE}>
                    <MdFlag className="flag-icon" /> Português
                  </option>
                  <option value={LOCALES.ENGLISH}>
                    <FaFlagUsa className="flag-icon" /> English
                  </option>
                  {/* Adicione outros idiomas suportados com ícones apropriados */}
                </select>
              </div>
            </div>

            <div className='pad-15'>
              <button className="save-button" onClick={() => this.applyChanges()}>
                <FormattedMessage id={"apply_configurations"}/>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default injectIntl(ConfigurationViewModal) as unknown as typeof ConfigurationViewModal;
