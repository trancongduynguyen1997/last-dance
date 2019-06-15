import React, { Component } from 'react';
import './App.css';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route } from "react-router-dom";

import store from './store';
import TopNavBar from './components/TopNavBar';
import Landing from './components/Landing';
import PrivateRoute from './components/PrivateRoute';
import { loadUser } from './actions/authAction';

import PlanPage from './components/pages/PlanPage';
import Motor1Page from './components/pages/Motor1Page';
import Motor2Page from './components/pages/Motor2Page';
import VirtualPage from './components/pages/VirtualPage';
import EntryPage from './components/pages/EntryPage';
import StatisticPage from './components/pages/StatisticPage';

class App extends Component {
  
  componentDidMount() {
    store.dispatch(loadUser());
  }

  render() {
    return (
      <Provider store = {store}>
        <Router>
          <div className="App" >
            <TopNavBar/>
            {/*<Users/>*/}
            <Route exact path="/" component={Landing} />
            <Route exact path="/monitor/1" component={Motor1Page}/>
            <Route exact path="/monitor/2" component={Motor2Page}/>
            <Route exact path="/live" component={VirtualPage}/>
            <Route exact path="/entry" component={EntryPage}/>
            <Route exact path="/statistic" component = {StatisticPage}/>
            <PrivateRoute exact path="/plan" component={PlanPage}/> 
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;
