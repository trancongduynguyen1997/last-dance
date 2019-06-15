require('dotenv').config();
const MaxScale1 = require('./models/model.maxscale1');
const utility = require("./controllers/controller.utility");
const monitorNotiesFunc = require("./controllers/controller.monitorNoties");
const operateNotiesFunc = require("./controllers/controller.operateNoties");
const operateTimeFunc = require("./controllers/controller.operateTime");

const moment = require('moment');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http').Server(app)
const io = require('socket.io')(http); //IO Socket
const mqtt = require('mqtt');
const path = require('path');
const port = process.env.PORT || 5000;

http.listen(port, function () {
	console.log(`Server starts on port ${port}`);
});

//Body-parser to read body req
app.use(express.json()); // for parsing application/json, express provide its own body-parser

//Use routes
app.use('/api/users', require('./routes/api/route.users'));
app.use('/api/auth', require('./routes/api/route.auth'));
app.use('/api/maxscale1', require('./routes/api/route.maxscale1'));
app.use('/api/plan', require('./routes/api/route.plan'));
app.get('/api/monitorNoties/:id', monitorNotiesFunc.fetchMonitorNoties);
app.get('/api/operateNoties/:id', operateNotiesFunc.fetchOperateNoties);
app.get('/api/operateTime/:id', operateTimeFunc.fetchOtime);


//connect to mongoDB
mongoose.connect(process.env.mongo_url, {
	useNewUrlParser: true,
	useCreateIndex: true
})
	.then(() => console.log('Connected to MongoDB'))
	.catch(err => console.log(err));

/*<===========================================IO SOCKET=======================================================>*/
/*<============================================MQTT CONNECTION============================================> */

const client = mqtt.connect(process.env.CLOUDMQTT_URL, { clientId: "axzicaqcwdaziussdasjdkjasd5" });

client.on("connect", function () {
	console.log("MQTT connected");
	client.subscribe('n/motorData', function (err) {
		if (err) {
			console.log(err);
		}
	})
	//+ Image
	client.subscribe('n/image', function (err) {
		if (err) {
			console.log(err);
		}
	})
});

client.on("error", function (err) {
	if (err) {
		console.log(err);
		client.end();
	}
})

//INITIAL VARIABLES----------------------------------------------------------------------------
//+ temp
let forwTemp = false; let revTemp = false; let stopTemp = false;
let faltTemp = false; let mtntTemp = false; let emrgTemp = false;
//+ height
let hBuffer = [{ h: 0, time: "00:00:00" }]; let hStore = [{ h: 0, time: "00:00:00" }]; let hStoreCopy = [];
//-Motor 1----------------------------------------------------------------------------
//+trend arr
let tor1Buffer = [{ tor: 0, time: "00:00:00" }]; let amp1Buffer = [{ amp: 0, time: "00:00:00" }];
let motor1TBuffer = [{ motorT: 0, time: "00:00:00" }]; let drive1TBuffer = [{ driveT: 0, time: "00:00:00" }];
let power1Buffer = [{ power: 0, time: "00:00:00" }];
let amp1Store = [{ amp: 0, time: "00:00:00" }]; let amp1StoreCopy = [];
let tor1Store = [{ tor: 0, time: "00:00:00" }]; let tor1StoreCopy = [];
let motor1TStore = [{ motorT: 0, time: "00:00:00" }]; let motor1TStoreCopy = [];
let drive1TStore = [{ driveT: 0, time: "00:00:00" }]; let drive1TStoreCopy = [];
let power1Store = [{ power: 0, time: "00:00:00" }]; let power1StoreCopy = [];
//+notification arr
let notiesArr1 = []; let operateNoties = [];
let notiesArr2 = [];
//-Motor 2----------------------------------------------------------------------------
//+trend arr
let tor2Buffer = [{ tor: 0, time: "00:00:00" }]; let amp2Buffer = [{ amp: 0, time: "00:00:00" }];
let motor2TBuffer = [{ motorT: 0, time: "00:00:00" }]; let drive2TBuffer = [{ driveT: 0, time: "00:00:00" }];
let power2Buffer = [{ power: 0, time: "00:00:00" }];
let amp2Store = [{ amp: 0, time: "00:00:00" }]; let amp2StoreCopy = [];
let tor2Store = [{ tor: 0, time: "00:00:00" }]; let tor2StoreCopy = [];
let motor2TStore = [{ motorT: 0, time: "00:00:00" }]; let motor2TStoreCopy = [];
let drive2TStore = [{ driveT: 0, time: "00:00:00" }]; let drive2TStoreCopy = [];
let power2Store = [{ power: 0, time: "00:00:00" }]; let power2StoreCopy = [];
//+ statistic
let powerInWeek = [
	{ power: 0, time: "Monday" },
	{ power: 0, time: "Tuesday" },
	{ power: 0, time: "Wednesday" },
	{ power: 0, time: "Thursday" },
	{ power: 0, time: "Friday" },
	{ power: 0, time: "Saturday" },
	{ power: 0, time: "Sunday" }
]
let powerInDay = [];
let powerInHour = [];
let tempHour = 0;

let fullTime;
let time;
let id0 = setInterval(() => {
	time = utility.getTime(false);
	fullTime = utility.getTime(true);
}, 1000);
//+ counter
let counter = {
	countAmp1: 0,
	countAmp2: 0,
	countTor1: 0,
	countTor2: 0,
	countMotor1T: 0,
	countMotor2T: 0,
	countDrive1T: 0,
	countDrive2T: 0,
	countPower1: 0,
	countPower2: 0,
	countH: 0
}
//+data to send to PLC
let toPLCData = [Number(15).toFixed(2), Number(7).toFixed(2), false, false, false, Number(1).toFixed(2), Number(15).toFixed(2), Number(3).toFixed(2), Number(0.3).toFixed(2), Number(3).toFixed(2)];
//+ max perfomance paras
let mp1 = [0, 0, 0, 0, 0];
let mp2 = [0, 0, 0, 0, 0];

//+ PLC Data
let motorData1 = {
	Cur0: 0,
	Cur1: 0,
	Tor0: 0,
	Tor1: 0,
	Pow0: 0,
	Pow1: 0,
	ThD0: 0,
	ThD1: 0
};
let motorData2 = {
	ThM0: 0,
	ThM1: 0,
	Hrs0: 0,
	Hrs1: 0,
	RSp0: 0,
	RSp1: 0,
	SSp0: 0,
	SSp1: 0
};
let motorData3 = {
	Fwrd: false,
	Stop: false,
	Reve: false,
	Falt: false,
	Mtnt: false,
	Emrg: false,
	HiFB: 0,
	HiEx: 0,
	FrSy: 0
};


let curFLvl1 = 0; let torFLvl1 = 0; let motorTFLvl1 = 0; let driveTFLvl1 = 0; let powFLvl1 = 0;
let curWLvl1 = 0; let torWLvl1 = 0; let motorTWLvl1 = 0; let driveTWLvl1 = 0; let powWLvl1 = 0;
let freFLvl1 = 0; let freWLvl1 = 0;
let curFLvl2 = 0; let torFLvl2 = 0; let motorTFLvl2 = 0; let driveTFLvl2 = 0; let powFLvl2 = 0;
let curWLvl2 = 0; let torWLvl2 = 0; let motorTWLvl2 = 0; let driveTWLvl2 = 0; let powWLvl2 = 0;
let freFLvl2 = 0; let freWLvl2 = 0;

//- RECEIVE DATA FROM PLC VIA MQTT
client.on("message", function (topic, message) {
	if (topic === "n/motorData") {
		//let motorData = JSON.parse(message.toString());
		let motorData = utility.PLCStrToObj(message);

		if (motorData.PkID === 1) {
			motorData1 = motorData;
		}
		else if (motorData.PkID === 2) {
			motorData2 = motorData;
		}
		else if (motorData.PkID === 3) {
			motorData3 = motorData;
		}
		//+create trend buffer
		if (time) {
			try {
				let amp1Obj, amp2Obj , tor1Obj, tor2Obj, drive1TObj , drive2TObj, power1Obj, power2Obj, motor1TObj , motor2TObj , hObj;
				amp1Obj = utility.createObj("amp", motorData1.Cur0);
				amp2Obj = utility.createObj("amp", motorData1.Cur1);
				tor1Obj = utility.createObj("tor", motorData1.Tor0);
				tor2Obj = utility.createObj("tor", motorData1.Tor1);
				drive1TObj = utility.createObj("driveT", motorData1.ThD0);
				drive2TObj = utility.createObj("driveT", motorData1.ThD1);
				power1Obj = utility.createObj("power", motorData1.Pow0);
				power2Obj = utility.createObj("power", motorData1.Pow1);
				motor1TObj = utility.createObj("motorT", motorData2.ThM0);
				motor2TObj = utility.createObj("motorT", motorData2.ThM1);
				hObj = utility.createObj("h", motorData3.HiFB);
				

				utility.objToBuffer(tor1Obj, tor1Buffer, 10);
				utility.objToBuffer(tor1Obj, tor1Store, 200);
				utility.objToBuffer(amp1Obj, amp1Buffer, 10);
				utility.objToBuffer(amp1Obj, amp1Store, 200);
				utility.objToBuffer(motor1TObj, motor1TBuffer, 10);
				utility.objToBuffer(motor1TObj, motor1TStore, 200);
				utility.objToBuffer(drive1TObj, drive1TBuffer, 10);
				utility.objToBuffer(drive1TObj, drive1TStore, 200);
				utility.objToBuffer(power1Obj, power1Buffer, 10);
				utility.objToBuffer(power1Obj, power1Store, 200);
				mp1[0] = utility.maxFilter(amp1Buffer, "amp"); mp1[1] = utility.maxFilter(tor1Buffer, "tor");
				mp1[2] = utility.maxFilter(motor1TBuffer, "motorT"); mp1[3] = utility.maxFilter(drive1TBuffer, "driveT");
				mp1[4] = utility.maxFilter(power1Buffer, "power");
				utility.objToBuffer(tor2Obj, tor2Buffer, 10);
				utility.objToBuffer(tor2Obj, tor2Store, 200);
				utility.objToBuffer(amp2Obj, amp2Buffer, 10);
				utility.objToBuffer(amp2Obj, amp2Store, 200);
				utility.objToBuffer(motor2TObj, motor2TBuffer, 10);
				utility.objToBuffer(motor2TObj, motor2TStore, 200);
				utility.objToBuffer(drive2TObj, drive2TBuffer, 10);
				utility.objToBuffer(drive2TObj, drive2TStore, 200);
				utility.objToBuffer(power2Obj, power2Buffer, 10);
				utility.objToBuffer(power2Obj, power2Store, 200);
				mp2[0] = utility.maxFilter(amp2Buffer, "amp"); mp2[1] = utility.maxFilter(tor2Buffer, "tor");
				mp2[2] = utility.maxFilter(motor2TBuffer, "motorT"); mp2[3] = utility.maxFilter(drive2TBuffer, "driveT");
				mp2[4] = utility.maxFilter(power2Buffer, "power");
				utility.objToBuffer(hObj, hBuffer, 10);
				utility.objToBuffer(hObj, hStore, 200);
				try {
					if (power1Buffer.length > 0) {
						var avgPowerIn10 = utility.averageObjCal(power1Buffer, "power");
						utility.objToBuffer(avgPowerIn10, powerInHour, 100);
						if (moment().get('hour') > tempHour) {
							let avgPowerInHour = utility.averageCal(powerInHour);
							utility.objToBuffer(avgPowerInHour, powerInDay, 24);
							tempHour = moment().get('hour');
							console.log(avgPowerInHour + " b");
						}
					}
				} catch (e) {
					console.log("there is no power element");
				}
			}
			catch (e) {
				console.log(e);
				console.log("because of undefined data from mqtt fake client");
			}
		}
		//+ Create monitor warning list
		try {

			MaxScale1.findOne({ _id: 1 }, "maxscale1").select('-_id')
				.then(payload => {
					let maxscale1 = payload.maxscale1;
					curFLvl1 = maxscale1[0].fault; curWLvl1 = maxscale1[0].warn;
					torFLvl1 = maxscale1[1].fault; torWLvl1 = maxscale1[1].warn;
					motorTFLvl1 = maxscale1[2].fault; motorTWLvl1 = maxscale1[2].warn;
					driveTFLvl1 = maxscale1[3].fault; driveTWLvl1 = maxscale1[3].warn;
					powFLvl1 = maxscale1[4].fault; powWLvl1 = maxscale1[4].warn;
					freFLvl1 = maxscale1[5].fault; freWLvl1 = maxscale1[5].warn;
					let ampWarn1, torWarn1, motorTWarn1, driveTWarn1, powerWarn1, freWarn1;
					utility.generateAlarm("more", motorData1.Cur0, ampWarn1, `Current is above ${curFLvl1}`, `Current is above ${curWLvl1}`, notiesArr1, curFLvl1, curWLvl1);
					utility.generateAlarm("more", motorData1.Tor0, torWarn1, `Torque is above ${torFLvl1}`, `Torque is above ${torWLvl1}`, notiesArr1, torFLvl1, torWLvl1);
					utility.generateAlarm("more", motorData2.ThM0, motorTWarn1, `Motor Thermal is above ${motorTFLvl1}`, `Motor Thermal is above ${motorTWLvl1}`, notiesArr1, motorTFLvl1, motorTWLvl1);
					utility.generateAlarm("more", motorData1.ThD0, driveTWarn1, `Drive Thermal is above ${driveTFLvl1}`, `Drive Thermal is above ${driveTWLvl1}`, notiesArr1, driveTFLvl1, driveTWLvl1);
					utility.generateAlarm("more", motorData1.Pow0, powerWarn1, `Power is above ${powFLvl1}`, `Power is under ${powWLvl1}`, notiesArr1, powFLvl1, powWLvl1);
					utility.generateAlarm("more", motorData2.RSp0, freWarn1, `Speed is above ${freFLvl1}`, `Power is above ${freWLvl1}`, operateNoties, freFLvl1, freWLvl1);
				})


			MaxScale1.findOne({ _id: 2 }, "maxscale1").select('-_id')
				.then(payload => {
					let maxscale1 = payload.maxscale1;
					curFLvl2 = maxscale1[0].fault; curWLvl2 = maxscale1[0].warn;
					torFLvl2 = maxscale1[1].fault; torWLvl2 = maxscale1[1].warn;
					motorTFLvl2 = maxscale1[2].fault; motorTWLvl2 = maxscale1[2].warn;
					driveTFLvl2 = maxscale1[3].fault; driveTWLvl2 = maxscale1[3].warn;
					powFLvl2 = maxscale1[4].fault; powWLvl2 = maxscale1[4].warn;
					freFLvl2 = maxscale1[5].fault; freWLvl2 = maxscale1[5].warn;
					let ampWarn2, torWarn2, motorTWarn2, driveTWarn2, powerWarn2, freWarn2;
					utility.generateAlarm("more", motorData1.Cur1, ampWarn2, `Current is above ${curFLvl2}`, `Current is above ${curWLvl2}`, notiesArr2, curFLvl2, curWLvl2);
					utility.generateAlarm("more", motorData1.Tor1, torWarn2, `Torque is above ${torFLvl2}`, `Torque is above ${torWLvl2}`, notiesArr2, torFLvl2, torWLvl2);
					utility.generateAlarm("more", motorData2.ThM1, motorTWarn2, `Motor Thermal is above ${motorTFLvl2}`, `Motor Thermal is above ${motorTWLvl2}`, notiesArr2, motorTFLvl2, motorTWLvl2);
					utility.generateAlarm("more", motorData1.ThD1, driveTWarn2, `Drive Thermal is above ${driveTFLvl2}`, `Drive Thermal is above ${driveTWLvl2}`, notiesArr2, driveTFLvl2, driveTWLvl2);
					utility.generateAlarm("more", motorData1.Pow1, powerWarn2, `Power is above ${powFLvl2}`, `Power is under ${powWLvl2}`, notiesArr2, powFLvl2, powWLvl2);
					utility.generateAlarm("more", motorData2.RSp1, freWarn2, `Speed is above ${freFLvl2}`, `Power is above ${freWLvl2}`, operateNoties, freFLvl2, freWLvl2);
				})
			if (motorData3.Fwrd) {
				if (motorData3.Fwrd !== forwTemp) {
					let noti = {};
					utility.generateOperateNoties(noti, `Forward at ${fullTime}`, operateNoties);
					forwTemp = motorData3.Fwrd;
				}
			}
			else if (!motorData3.Fwrd) {
				forwTemp = motorData3.Fwrd;
			}
			if (motorData3.Stop) {
				if (motorData3.Stop !== stopTemp) {
					let noti = {};
					utility.generateOperateNoties(noti, `Stop at ${fullTime}`, operateNoties);
					stopTemp = motorData3.Stop;
				}
			}
			else if (!motorData3.Stop) {
				stopTemp = motorData3.Stop;
			}
			if (motorData3.Reve) {
				if (motorData3.Reve !== revTemp) {
					let noti = {};
					utility.generateOperateNoties(noti, `Reverse at ${fullTime}`, operateNoties);
					revTemp = motorData3.Reve;
				}
			}
			else if (!motorData3.Reve) {
				revTemp = motorData3
			}
			if (motorData3.Mtnt) {
				if (motorData3.Mtnt !== mtntTemp) {
					let noti = {};
					utility.generateOperateNoties(noti, `Reach maintenance at ${fullTime}`, operateNoties);
					mtntTemp = motorData3.Mtnt;
				}
			}
			else if (!motorData3.Mtnt) {
				mtntTemp = motorData3.Mtnt;
			}
			if (motorData3.Falt) {
				if (motorData3.Falt !== faltTemp) {
					let noti = {};
					utility.generateOperateNoties(noti, `Fault at ${fullTime}`, operateNoties);
					faltTemp = motorData3.Falt;
				}
			}
			else if (!motorData3.Falt) {
				faltTemp = motorData3.Falt;
			}
			if (motorData3.Emrg) {
				if (motorData3.Emrg !== emrgTemp) {
					let noti = {};
					utility.generateOperateNoties(noti, `Emergency stop at ${fullTime}`, operateNoties);
					emrgTemp = motorData3.Emrg;
				}
			}
			else if (!motorData3.Emrg) {
				emrgTemp = motorData3.Emrg;
			}
		} catch (e) {
			console.log(e);
			console.log("because of undefined data from mqtt fake client");
		}
	}
})

setInterval(() => {
	monitorNotiesFunc.updateMonitorNoties(1, notiesArr1);
	monitorNotiesFunc.updateMonitorNoties(2, notiesArr2);
	operateNotiesFunc.updateOperateNoties(1, operateNoties);
}, 5000)

setInterval(() => {
	operateTimeFunc.updateOtime(1, motorData2.Hrs0);
	operateTimeFunc.updateOtime(2, motorData2.Hrs1);
}, 120000)

let timeout = moment().get("millisecond") + moment().get("second") * 1000 + moment().get("minute") * 60 * 1000
	+ moment().get("hour") * 60 * 60 * 1000;


setTimeout(() => {
	setInterval(() => {
		let avgPowerInDay = utility.averageCal(powerInDay);
		switch (moment().day()) {
			case 0:
				powerInWeek[6].power = avgPowerInDay;
				break;
			case 1:
				powerInWeek[0].power = avgPowerInDay;
				break;
			case 2:
				powerInWeek[1].power = avgPowerInDay;
				break;
			case 3:
				powerInWeek[2].power = avgPowerInDay;
				break;
			case 4:
				powerInWeek[3].power = avgPowerInDay;
				break;
			case 5:
				powerInWeek[4].power = avgPowerInDay;
				break;
			case 6:
				powerInWeek[5].power = avgPowerInDay;
				break;
			default:
				break;
		}
	}, 86400000)
}, 86399000 - timeout)

//TRANSFER BETWEEN FE AND PLC WITH IO & MQTT----------------------------------------------------------------------------
io.on('connection', function (socket) {
	console.log('server-side socket connected');
	socket.on("error", (err) => {
		if (err) {
			console.log(err);
		}
		socket.disconnect();
	})
	//-send to fe client-----------------------------------------------------------------------------------------
	client.on("message", function (topic, message) {
		if (topic === "n/motorData") {
			//+send dcData, warn, info to fe
			if (motorData2.Hrs0 && motorData2.Hrs1) {
				socket.emit("motor1OTime", motorData2.Hrs0);
				socket.emit("motor2OTime", motorData2.Hrs1);
			}
			try {
				socket.emit("warnList1", notiesArr1);
				socket.emit("motor1DCData1", motorData1);
				socket.emit("motor1DCData2", motorData2);
				if (motorData1) {
					socket.emit("motor1Info1", {
						amp: motorData1.Cur0,
						torque: motorData1.Tor0,
						driveT: motorData1.ThD0,
						power: motorData1.Pow0
					});
				}
				if (motorData2.ThM0) {
					socket.emit("motor1Info2", motorData2.ThM0)
				}
				socket.emit("warnList2", notiesArr2);
				socket.emit("motor2DCData1", motorData1);
				socket.emit("motor2DCData2", motorData2);
				if (motorData1) {
					socket.emit("motor2Info1", {
						amp: motorData1.Cur1,
						torque: motorData1.Tor1,
						driveT: motorData1.ThD1,
						power: motorData1.Pow1
					});
				}
				if (motorData2.ThM1) {
					socket.emit("motor2Info2", motorData2.ThM1)
				}
				socket.emit("operationNoties", operateNoties);
			} catch (e) {
				console.log("because of undefined data from mqtt fake client");
			}
			//+status
			if (motorData3) {
				socket.emit("motorStatus", {
					forw: motorData3.Fwrd,
					reve: motorData3.Reve,
					stop: motorData3.Stop,
					maint: motorData3.Mtnt,
					fault: motorData3.Falt,
					emer: motorData3.Emrg,
					hiex: motorData3.HiEx,
					hifb: motorData3.HiFB,
					freq: motorData3.FrSy,
				});
			}
			if (motorData2) {
				socket.emit("motorStatus2", {
					ssp1: motorData2.SSp0,
					ssp2: motorData2.SSp1
				})
			}

		}
	});
	
	//+trending
	let id1 = setInterval(function () {
		socket.emit("motor1TCTor", tor1Buffer);
		socket.emit("motor1TCAmp", amp1Buffer);
		socket.emit("motor1TCMotorT", motor1TBuffer);
		socket.emit("motor1TCDriveT", drive1TBuffer);
		socket.emit("motor1TCPower", power1Buffer);
		socket.emit("mp1", mp1);
		socket.emit("motor2TCTor", tor2Buffer);
		socket.emit("motor2TCAmp", amp2Buffer);
		socket.emit("motor2TCMotorT", motor2TBuffer);
		socket.emit("motor2TCDriveT", drive2TBuffer);
		socket.emit("motor2TCPower", power2Buffer);
		socket.emit("mp2", mp2);
	}, 10000);
	let id2 = setInterval(function () {
		socket.emit("heightAmount", hBuffer);
	}, 1000);
	let id3 = setInterval(function () {
		socket.emit("powerInWeek", powerInWeek);
	}, 43200000);
	//+image
	client.on("message", function (topic, message) {
		if (topic === "n/image") {
			console.log("sent");
			socket.emit("picture", message.toString());
		}
	})
	//+flag
	socket.on("stopStoring", function (stopFlag) {
		if (stopFlag === "amp1StopFlag") {
			counter.countAmp1 = 0;
			amp1StoreCopy = amp1Store.concat();
		}
		if (stopFlag === "tor1StopFlag") {
			counter.countTor1 = 0;
			tor1StoreCopy = tor1Store.concat();
		}
		if (stopFlag === "motor1TStopFlag") {
			counter.countMotor1T = 0;
			motor1TStoreCopy = motor1TStore.concat();
		}
		if (stopFlag === "drive1TStopFlag") {
			counter.countDrive1T = 0;
			drive1TStoreCopy = drive1TStore.concat();
		}
		if (stopFlag === "power1StopFlag") {
			counter.countPower1 = 0;
			power1StoreCopy = power1Store.concat();
		}
		if (stopFlag === "amp2StopFlag") {
			counter.countAmp2 = 0;
			amp2StoreCopy = amp2Store.concat();
		}
		if (stopFlag === "tor2StopFlag") {
			counter.countTor2 = 0;
			tor2StoreCopy = tor2Store.concat();
		}
		if (stopFlag === "motor2TStopFlag") {
			counter.countMotor2T = 0;
			motor2TStoreCopy = motor2TStore.concat();
		}
		if (stopFlag === "drive2TStopFlag") {
			counter.countDrive2T = 0;
			drive2TStoreCopy = drive2TStore.concat();
		}
		if (stopFlag === "power2StopFlag") {
			counter.countPower2 = 0;
			power2StoreCopy = power2Store.concat();
		}
		if (stopFlag === "hStopFlag") {
			countH = 10;
			hStoreCopy = hStore.concat();
		}
	})
	//-----------------------------------------------xFUNCTIONx------------------------------------------------
	let firstForwFlag = null;
	
	function slideBackTrend(type, countName, counter, copyStore) {
		let currentIdx = copyStore.length;
		console.log(copyStore);
		if (firstForwFlag === 1) {
			firstForwFlag = null;
			counter[countName] += 20;
		} else if ((currentIdx - counter[countName]) >= 0) {
			counter[countName] += 10;
		}
		if (currentIdx >= 10 && ((currentIdx - counter[countName]) >= 0)) {
			let reviewData = copyStore.slice(currentIdx - counter[countName], currentIdx - counter[countName] + 10);
			socket.emit(type, reviewData);
		}
		else if (currentIdx >= 10 && ((currentIdx - counter[countName]) < 0)) {
			let reviewData = copyStore.slice(0, 11);
			socket.emit(type, reviewData);
		}
		else if (currentIdx < 10) {
			socket.emit(type, copyStore);
		}
	}
	function slideForwTrend(type, countName, counter, copyStore) {
		let currentIdx = copyStore.length;
		counter[countName] -= 10;

		if (counter[countName] <= 0) {
			counter[countName] = 0;
			let reviewData = copyStore.slice(currentIdx - 10, currentIdx);
			firstForwFlag = 1;
			socket.emit(type, reviewData);
		}
		else if (currentIdx >= 10 && currentIdx >= counter[countName]) {
			let reviewData = copyStore.slice(currentIdx - counter[countName], currentIdx - counter[countName] + 10);
			socket.emit(type, reviewData);
		}
		else if (currentIdx >= 10 && (currentIdx < counter[countName])) {
			let reviewData = copyStore.slice(0, currentIdx - counter[countName] + 10);
			socket.emit(type, reviewData);
		}

		if (currentIdx < 10) {
			socket.emit(type, copyStore);
		}
	}
	//------------------------------------------------------x--------------------------------------------------
	socket.on("reviewStore", function (reviewFlag) {
		if (reviewFlag === "hReviewFlag") {
			slideBackTrend("reviewH", "countH", counter, hStoreCopy);
		}
		if (reviewFlag === "hForwFlag") {
			slideForwTrend("reviewH", "countH", counter, hStoreCopy);
		}
		if (reviewFlag === "amp1ReviewFlag") {
			slideBackTrend("reviewAmp1", "countAmp1", counter, amp1StoreCopy);
		}
		if (reviewFlag === "amp1ForwFlag") {
			slideForwTrend("reviewAmp1", "countAmp1", counter, amp1StoreCopy);
		}
		if (reviewFlag === "tor1ReviewFlag") {
			slideBackTrend("reviewTor1", "countTor1", counter, tor1StoreCopy);
		}
		if (reviewFlag === "tor1ForwFlag") {
			slideForwTrend("reviewTor1", "countTor1", counter, tor1StoreCopy);
		}
		if (reviewFlag === "motor1TReviewFlag") {
			slideBackTrend("reviewMotor1T", "countMotor1T", counter, motor1TStoreCopy);
		}
		if (reviewFlag === "motor1TForwFlag") {
			slideForwTrend("reviewMotor1T", "countMotor1T", counter, motor1TStoreCopy);
		}
		if (reviewFlag === "drive1TReviewFlag") {
			slideBackTrend("reviewDrive1T", "countDrive1T", counter, drive1TStoreCopy);
		}
		if (reviewFlag === "drive1TForwFlag") {
			slideForwTrend("reviewDrive1T", "countDrive1T", counter, drive1TStoreCopy);
		}
		if (reviewFlag === "power1ReviewFlag") {
			slideBackTrend("reviewPower1", "countPower1", counter, power1StoreCopy);
		}
		if (reviewFlag === "power1ForwFlag") {
			slideForwTrend("reviewPower1", "countPower1", counter, power1StoreCopy);
		}
		if (reviewFlag === "amp2ReviewFlag") {
			slideBackTrend("reviewAmp2", "countAmp2", counter, amp2StoreCopy);
		}
		if (reviewFlag === "amp2ForwFlag") {
			slideForwTrend("reviewAmp2", "countAmp2", counter, amp2StoreCopy);
		}
		if (reviewFlag === "tor2ReviewFlag") {
			slideBackTrend("reviewTor2", "countTor2", counter, tor2StoreCopy);
		}
		if (reviewFlag === "tor2ForwFlag") {
			slideForwTrend("reviewTor2", "countTor2", counter, tor2StoreCopy);
		}
		if (reviewFlag === "motor2TReviewFlag") {
			slideBackTrend("reviewMotor2T", "countMotor2T", counter, motor2TStoreCopy);
		}
		if (reviewFlag === "motor2TForwFlag") {
			slideForwTrend("reviewMotor2T", "countMotor2T", counter, motor2TStoreCopy);
		}
		if (reviewFlag === "drive2TReviewFlag") {
			slideBackTrend("reviewDrive2T", "countDrive2T", counter, drive2TStoreCopy);
		}
		if (reviewFlag === "drive2TForwFlag") {
			slideForwTrend("reviewDrive2T", "countDrive2T", counter, drive2TStoreCopy);
		}
		if (reviewFlag === "power2ReviewFlag") {
			slideBackTrend("reviewPower2", "countPower2", counter, power2StoreCopy);
		}
		if (reviewFlag === "power2ForwFlag") {
			slideForwTrend("reviewPower2", "countPower2", counter, power2StoreCopy);
		}
	})
	//-fe client publishing----------------------------------------------------------------------------
	//- PLC
	//+ send freq

	socket.on("setFrequency", function (frequency) {
		toPLCData[0] = frequency;
		let msg = utility.ArrToPLCMsg(toPLCData);
		client.publish("n/toPLC", msg, function (err) {
			if (err) {
				console.log(err);
			}
		})
		let noti = {};
		utility.generateOperateNoties(noti, `Set sync speed to ${frequency} at ${fullTime}`, operateNoties);
		operateNotiesFunc.updateOperateNoties(1, operateNoties);
	})
	//+ send Kp, Ki, Kd
	socket.on("setK", function (K) {
		toPLCData[5] = K;
		let msg = utility.ArrToPLCMsg(toPLCData);
		client.publish("n/toPLC", msg, function (err) {
			if (err) {
				console.log(err);
			}
		})
		let noti = {};
		utility.generateOperateNoties(noti, `Set K to ${K} at ${fullTime}`, operateNoties);
		operateNotiesFunc.updateOperateNoties(1, operateNoties);
	})
	socket.on("setTau", function (Tau) {
		toPLCData[6] = Tau;
		let msg = utility.ArrToPLCMsg(toPLCData);
		client.publish("n/toPLC", msg, function (err) {
			if (err) {
				console.log(err);
			}
		})
		let noti = {};
		utility.generateOperateNoties(noti, `Set Tau to ${Tau} at ${fullTime}`, operateNoties);
		operateNotiesFunc.updateOperateNoties(1, operateNoties);
	})
	socket.on("setKp", function (Kp) {
		toPLCData[7] = Kp;
		let msg = utility.ArrToPLCMsg(toPLCData);
		client.publish("n/toPLC", msg, function (err) {
			if (err) {
				console.log(err);
			}
		})
		let noti = {};
		utility.generateOperateNoties(noti, `Set Kp to ${Kp} at ${fullTime}`, operateNoties);
		operateNotiesFunc.updateOperateNoties(1, operateNoties);
	})
	socket.on("setKi", function (Ki) {
		toPLCData[8] = Ki;
		let msg = utility.ArrToPLCMsg(toPLCData);
		client.publish("n/toPLC", msg, function (err) {
			if (err) {
				console.log(err);
			}
		})
		let noti = {};
		utility.generateOperateNoties(noti, `Set Ki to ${Ki} at ${fullTime}`, operateNoties);
		operateNotiesFunc.updateOperateNoties(1, operateNoties);
	})
	socket.on("setKd", function (Kd) {
		toPLCData[9] = Kd;
		let msg = utility.ArrToPLCMsg(toPLCData);
		client.publish("n/toPLC", msg, function (err) {
			if (err) {
				console.log(err);
			}
		})
		let noti = {};
		utility.generateOperateNoties(noti, `Set Kd to ${Kd} at ${fullTime}`, operateNoties);
		operateNotiesFunc.updateOperateNoties(1, operateNoties);
	})
	//+ send height
	socket.on("setHeight", function (height) {
		toPLCData[1] = height;
		let msg = utility.ArrToPLCMsg(toPLCData);
		client.publish("n/toPLC", msg, function (err) {
			if (err) {
				console.log(err);
			}
			let noti = {};
			utility.generateOperateNoties(noti, `Set height to ${height} at ${fullTime}`, operateNoties);
			operateNotiesFunc.updateOperateNoties(1, operateNoties);
		})
	})
	//+ virtual btn send for,rev,stop,service CMD
	socket.on("vCmdToPLC", function (cmd) {
		if (cmd === "onForward") {
			toPLCData[2] = true;
			toPLCData[4] = false;
			toPLCData[3] = false;
		}
		else if (cmd === "onStop") {
			toPLCData[3] = true;
			toPLCData[4] = false;
			toPLCData[2] = false;
		}
		else if (cmd === "onReverse") {
			toPLCData[4] = true;
			toPLCData[3] = false;
			toPLCData[2] = false;
		}
		msg = utility.ArrToPLCMsg(toPLCData);
		setTimeout(() => {
			client.publish("n/toPLC", msg, function (err) {
				if (err) {
					console.log(err);
				}
				setTimeout(() => {
					toPLCData[4] = false;
					toPLCData[3] = false;
					toPLCData[2] = false;
				}, 1000)
			})
		}, 1000)
		

	})
	//- NX
	socket.on("vCmdToNX", function (cmd) {
		client.publish("n/virtualNXCmd", cmd, function (err) {
			if (err) {
				console.log(err);
			}
		})
	})

	socket.on("disconnect", (reason) => {
		if (reason === 'io server disconnect') {
			// the disconnection was initiated by the server, you need to reconnect manually
			socket.connect();
		}
		clearInterval(id0);
		clearInterval(id1);
		clearInterval(id2);
		console.log("Disconnect");
	});
});

//Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
	//Set static folder
	app.use(express.static('frontend/build'));

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
	})
}

