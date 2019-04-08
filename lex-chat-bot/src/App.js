import React, { Component } from 'react';
import './App.css';
import LexChat from './lexChat';
import { metaData } from './Sampleconst';


class App extends Component {

  constructor(props) {
    super(props);
    this.state = { items: [], isLoaded: true };
  }

  componentDidMount = () => {

  }

  getFloorplans = (val) => {

    this.setState({
      isLoaded: true,
      items: metaData.data.slice(0, val),
    });
  }

  resetData = () => {
    this.setState({ items: [] });
  }

  render() {
    return (
      <div className="App">
        {
          (!(this.state.items && this.state.items.length > 0)) && <header className="App-header h1">
            Welcome to RealPage Virtual Assistant.
       </header>
        }
        {
          (this.state.items && this.state.items.length > 0) &&
          <div className="text-left">
            <h3 className="h4 pb-2">Property List</h3>
          </div>
        }
        <table className='table table-striped table-bordered'>
          {
            (this.state.items && this.state.items.length > 0) &&
            <thead>
              <tr>
                <th>
                  Property Name
              </th>
                <th>
                  Location
              </th>
              </tr>
            </thead>
          }
          <tbody>
            {this.state.items && this.state.items.map(function (item, key) {
              return (
                <tr key={key}>
                  <td>{item.property_name}</td>
                  <td>{item.state_name}</td>
                </tr>
              )

            })}</tbody>
        </table>

        <LexChat botName="Real_page_lex"
          IdentityPoolId="us-east-1:67c4a944-8f5f-487c-8c50-0471938764de"
          placeholder="Enter your query"
          style={{ position: 'absolute' }}
          backgroundColor="#FFFFFF"
          height="400px"
          region="us-east-1"
          headerText="Online Support" onChange={this.getFloorplans} resetData={this.resetData} />
      </div>
    );
  }
}

export default App;
