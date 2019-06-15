import React, { Component } from 'react'
import io from "socket.io-client";

import './CSS/MotorInfoStyle.css';

export default class MotorInfo extends Component {
  state = {
    amp: 0,
    tor: 0,
    motorT: 0,
    driveT: 0,
    power: 0
  }
  render() {
    const { amp, tor, motorT, driveT, power } = this.state;
    return (
      <div className="motor-info">
      <div className="title"><pre>{this.props.children}</pre></div>
        <div>
          <pre>Current:       {Number(amp).toFixed(2)}   A</pre>
        </div>
        <div>
        <pre>Torque:        {Number(tor).toFixed(2)}  Nm</pre>
        </div>
        <div>
        <pre>Motor Thermal: {Number(motorT).toFixed(2)}  %</pre>
        </div>

        <div>
        <pre>Drive Thermal: {Number(driveT).toFixed(2)}  %</pre>
        </div>

        <div>
        <pre>Power:         {Number(power).toFixed(2)}   W</pre>
        </div>

      </div>
    )
  }

  componentDidMount() {
    this.socket = io().connect();
    this.socket.on(this.props.ioTopic[0], function (motorObj) {
      this.setState({
        amp: motorObj.amp,
        tor: motorObj.torque,
        driveT: motorObj.driveT,
        power: motorObj.power
      })
    }.bind(this));        
    this.socket.on(this.props.ioTopic[1], function (motorT) {
      this.setState({
        motorT: motorT
      })
    }.bind(this));
  }

  componentWillUnmount() {
    this.socket.disconnect();
    this.socket.on("connect_error", function (error) {
      console.log(error);
      this.socket.disconnect();
    })
  };

}
