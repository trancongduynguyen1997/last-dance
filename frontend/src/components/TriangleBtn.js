import React, { Component } from 'react';
import io from "socket.io-client";
export default class TriangleBtn extends Component {

  componentDidMount() {
      this.socket = io();
  };
  componentWillUnmount() {
      this.socket.disconnect();
      this.socket.on("connect_error", function (error) {
          console.log(error);
          this.socket.disconnect();
      })
  };
  render() {
    let {hiex} = this.props;
    let amount = hiex*20;
    let pointGroup = `36,${309-amount} 36,${325-amount} 48,${317-amount}`;
    return (
      <div className="triangle-btn-box">
        <svg width="50" height="340"  >
            <polygon className="triangle" points={pointGroup} onClick={this.props.onOpenModal}></polygon>
        </svg>
        <div className="hiexp" style={{top: `${19 - hiex*1.25}em`}}>{hiex}</div>
      </div>
    )
  }
}
