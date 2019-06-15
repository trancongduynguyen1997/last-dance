import React, { Component } from 'react'
import io from "socket.io-client";

import TrendChart from './TrendChart';
import '../CSS/TrendChartStyle.css';
let isStop = false;

export default class HeightTC extends Component {
    state = {
        data: [{
            time: "00:00:00",
            h: 0
        }]
    }
    componentDidMount() {
        this.socket = io();
        this.socket.on(this.props.ioTopic, function (hBuffer) {
            if (!isStop) {
                this.setState((state) => {
                    return {
                        data: hBuffer
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
    onStopClick = () => {
        isStop = !isStop;
        this.socket.emit("stopStoring", this.props.stopFlag);
    }
    onReviewClick = () => {
        if (isStop) {
            this.socket.emit("reviewStore", this.props.reviewFlag);
            this.socket.on(this.props.reviewData, function (reviewData) {
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
            <div className="height-tc">
                <div className="review-btn" onClick={this.onReviewClick}><i className="fas fa-angle-left"></i></div>
                <div className="forw-btn" onClick={this.onForwClick}><i className="fas fa-angle-right"></i></div>
                <TrendChart data={this.state.data}
                    dataKey="h"
                    yAxisName="Height (cm)"
                    customColor="#1985A1"
                    colorId="heightTC"
                    width={425}
                    height={200}
                    onStopClick={this.onStopClick} >
                </TrendChart>
            </div>
        )
    }
}
