import React, { Component } from 'react'
import io from "socket.io-client";

import TrendChart from './TrendChart';
import '../CSS/TrendChartStyle.css';
let isStop = false;

export default class TorqueTC extends Component {
  state = {
    data: [{
      time: "00:00:00",
      tor: 0
    }]
  }
  onStopClick = () => {
    isStop = !isStop;
    this.socket.emit("stopStoring", this.props.stopFlag);
  }
  onReviewClick = () => {
    if (isStop) {
      this.socket.emit("reviewStore", this.props.reviewFlag);
      this.socket.on(this.props.reviewData, function (reviewData) {
        console.log(reviewData);
        this.setState((state) => {
          return {
            data: reviewData
          }
        });

      }.bind(this));
    }
  }
  onForwClick = () => {
    if (isStop) {
        this.socket.emit("reviewStore", this.props.forwFlag);
        this.socket.on(this.props.reviewData, function (reviewData) {
         
                this.setState((state) => {
                    return {
                        data: reviewData
                    }
                });
            
        }.bind(this));
    }
}
componentWillReceiveProps(nxtProps) {
  if(nxtProps.allPauseState !== this.props.allPauseState) {
      this.onStopClick();
  }
}
  render() {
    return (
      <div>
        <div className="review-btn" onClick={this.onReviewClick}><i className="fas fa-angle-left"></i></div>
        <div className="forw-btn" onClick={this.onForwClick}><i className="fas fa-angle-right"></i></div>
        <TrendChart data={this.state.data}
          width={450}
          height={210}
          dataKey="tor"
          yAxisName="Torque (N/m)"
          customColor="#BC96E6"
          colorId="torqueTC"
          onStopClick={this.onStopClick} ></TrendChart>
      </div>
    )
  }

  componentDidMount() {
    this.socket = io();
    this.socket.on(this.props.ioTopic, function (torBuffer) {
      if (!isStop) {
        this.setState((state) => {
          return {
            data: torBuffer
          }
        });
      }
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
