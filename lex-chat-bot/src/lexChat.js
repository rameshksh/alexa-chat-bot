import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AWS from 'aws-sdk';
import "./styles/chatbot.css";


class LexChat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: '',
      lexUserId: 'chatbot-demo' + Date.now(),
      sessionAttributes: {},
      visible: 'closed'
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    document.getElementById("inputField").focus();
    AWS.config.region = this.props.region || 'us-east-1';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this.props.IdentityPoolId,
    });
    var lexruntime = new AWS.LexRuntime();
    this.lexruntime = lexruntime;

  }

  handleClick(event) {
    this.setState({
      visible: this.state.visible == 'open' ? 'closed' : 'open',
      data: '',
      isAudioUsed: false
    });

    this.pushChat(event, 'Hello');
  }

  pushChat(event, text) {
    event.preventDefault();

    var inputFieldText = document.getElementById('inputField');

    if (text) {
      inputFieldText.value = text;
    }

    if (inputFieldText && inputFieldText.value && inputFieldText.value.trim().length > 0) {

      // disable input to show we're sending it
      var inputField = inputFieldText.value.trim();
      inputFieldText.value = '...';
      inputFieldText.locked = true;

      // send it to the Lex runtime
      var params = {
        botAlias: '$LATEST',
        botName: this.props.botName,
        inputText: inputField,
        userId: this.state.lexUserId,
        sessionAttributes: this.state.sessionAttributes
      };

      this.showRequest(inputField);

      var fn = function (err, data) {
        if (err) {
          console.log(err, err.stack);
          this.showError('Error:  ' + err.message + ' (see console for details)')
        }
        if (data) {
          // capture the sessionAttributes for the next cycle
          this.setState({ sessionAttributes: data.sessionAttributes, isAudioUsed: false })
          //sessionAttributes = data.sessionAttributes;
          // show response and/or error/dialog status
          this.showResponse(data);
        }
        // re-enable input
        inputFieldText.value = '';
        inputFieldText.locked = false;
      };

      this.lexruntime.postText(params, fn.bind(this));
    }
    // we always cancel form submission
    return false;
  }

  pushAudioText(text) {

    var inputFieldText = document.getElementById('inputField');

    // send it to the Lex runtime
    var params = {
      botAlias: '$LATEST',
      botName: this.props.botName,
      inputText: text,
      userId: this.state.lexUserId,
      sessionAttributes: this.state.sessionAttributes
    };
    var fn = function (err, data) {
      if (err) {
        console.log(err, err.stack);
        this.showError('Error:  ' + err.message + ' (see console for details)')
      }
      if (data) {
        // capture the sessionAttributes for the next cycle
        this.setState({ sessionAttributes: data.sessionAttributes, isAudioUsed: true })
        //sessionAttributes = data.sessionAttributes;
        // show response and/or error/dialog status
        this.showResponse(data);
      }
      if (inputFieldText) {
        // re-enable input
        inputFieldText.value = '';
        inputFieldText.locked = false;
      }
    };

    this.lexruntime.postText(params, fn.bind(this));
  }

  showRequest(daText) {
    var conversationDiv = document.getElementById('conversation');
    var requestPara = document.createElement("P");
    requestPara.className = 'userRequest';
    requestPara.appendChild(document.createTextNode(daText));
    conversationDiv.appendChild(requestPara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  showError(daText) {

    var conversationDiv = document.getElementById('conversation');
    var errorPara = document.createElement("P");
    errorPara.className = 'lexError';
    errorPara.appendChild(document.createTextNode(daText));
    conversationDiv.appendChild(errorPara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  showResponse(lexResponse) {

    var conversationDiv = document.getElementById('conversation');
    var responsePara = document.createElement("P");

    responsePara.className = 'lexResponse';

    if (lexResponse.message) {
      responsePara.appendChild(document.createTextNode(lexResponse.message));
      responsePara.appendChild(document.createElement('br'));

      if (lexResponse.message && (lexResponse.message.indexOf('Showing') >= 0 || lexResponse.message.indexOf('list') > 0)) {
        this.props.onChange(10);
      } else {
        this.props.resetData();
      }

      if (this.state.isAudioUsed) {
        this.speak(lexResponse.message);
      }
    }
    if (lexResponse.dialogState === 'ReadyForFulfillment') {
      responsePara.appendChild(document.createTextNode(
        'Ready for fulfillment'));
      // TODO:  show slot values
    } else {
      responsePara.appendChild(document.createTextNode(''));
    }
    conversationDiv.appendChild(responsePara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;

  }

  recognizeSpeech() {
    //event.preventDefault();

    var inputFieldText = document.getElementById('inputField');
    let sr = window.webkitSpeechRecognition || window.SpeechRecognition;
    let recognition = new sr();

    if (inputFieldText) {
      inputFieldText.value = '';
      inputFieldText.locked = true;
    }

    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = function () {
      var el = document.getElementById('micBtn');
      el.classList.add("fa-microphone-slash");
    }

    recognition.onend = function () {
      var el = document.getElementById('micBtn');
      el.classList.remove("fa-microphone-slash");
    }

    recognition.onresult = (res) => {
      let text = res.results[0][0].transcript;
      // localStorage.setItem('isDisplay',true);

      if (text && (text.indexOf('Showing') >= 0 || text.indexOf('list') > 0)) {
        this.handleClick();
        this.props.onChange();
      }

      this.showRequest(text);

      this.pushAudioText(text);
    };

    recognition.start();
  }

  speak(data) {
    var msg = new SpeechSynthesisUtterance(data);

    window.speechSynthesis.speak(msg);
  }

  handleChange(event) {
    event.preventDefault();
    this.setState({ data: event.target.value });
  }

  render() {

    const inputStyle = {
      padding: '4px',
      fontSize: 16,
      width: '350px',
      height: '40px',
      borderRadius: '1px',
      border: '10px',
    }

    const conversationStyle = {
      width: '400px',
      height: this.props.height,
      border: 'px solid #ccc',
      backgroundColor: this.props.backgroundColor,
      padding: '4px',
      overflow: 'auto',
      borderBottom: 'thin ridge #bfbfbf'
    }

    const headerRectStyle = {
      backgroundColor: '#0075cc',
      width: '408px',
      height: '40px',
      textAlign: 'left',
      padding: '8px',
      color: '#fff',
      fontSize: '16px',
      cursor: 'pointer'
    }

    const chatcontainerStyle = {
      backgroundColor: '#FFFFFF',
      width: 408
    }

    const chatFormStyle = {
      margin: '1px',
      padding: '2px',
      height: '40px'
    }


    return (
      <div id="chatwrapper">
        <div id="chat-header-rect" style={headerRectStyle} onClick={this.handleClick} >
          {this.props.headerText}
          {
            (this.state.visible === 'open') ? <span className='chevron top'></span>
              : <span className='chevron bottom'></span>
          }
        </div>
        <div id="chatcontainer" className={this.state.visible} style={chatcontainerStyle}>
          <div id="conversation" style={conversationStyle} ></div>
          <form id="chatform" style={chatFormStyle} onSubmit={this.pushChat.bind(this)}>
            <div className="toolbar-container">
              <i id="micBtn" className="fa fa-microphone fa-lg" onClick={this.recognizeSpeech.bind(this)} ></i>
              <input type="text"
                autoComplete="off"
                id="inputField"
                size="40"
                value={this.state.data}
                placeholder={this.props.placeholder}
                onChange={this.handleChange.bind(this)}
                style={inputStyle}
              />
            </div>
          </form>
        </div>
      </div>
    )
  }
}

LexChat.propTypes = {
  botName: PropTypes.string,
  IdentityPoolId: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string,
  height: PropTypes.number,
  headerText: PropTypes.string
}

export default LexChat;