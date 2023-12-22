// main.js
import React,{useEffect, useState} from 'react';
import { Menu } from 'native-base';
import { View, Text,Dimensions  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeBaseProvider, Center, Box, Heading,Spinner , VStack, FormControl, Input, Link, Button, HStack , Image, useToast} from 'native-base';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
// import Constants from 'expo-constants';
// const {AUTH02_DOMAIN, AUTH03_DOMAIN } = Constants.mfest.extra;



const Main = () => {
  const domain1='http://192.168.0.19:8080/app/main/ele'
  const domain2='http://192.168.0.19:8080/app/main/eachEle'
  const domain3='http://192.168.0.19:8080/app/main/bill'
  const [eleData , setEleData] = useState(null); // 토큰을 기반으로 데이터 요청을 받아와서 그걸 상태에 저장.
  const [combinData , setCombineData] = useState(null); // 토큰을 기반으로 데이터 요청을 받아와서 그걸 상태에 저장.
  const [labels, setLabels] =useState([]);
  const [values, setValues] =useState([]);
  const [todayEle, setTodayEle] = useState([]);
  // 요금
  const [mybill, setMybill] = useState(0); // 내요금
  const [myPbill, setPMybill] = useState(0); // 전달요금 현재일자
  const [myLybill, setLyMybill] = useState(0); // 전년동월요금 현재일자
  // 탄소계산기
  const [wele , setWele] = useState("");
  const [myKele, setKele] = useState("");
  const [co2Ele, setCo2Ele] = useState(""); // 내요금
  const [ecoEle, setEcoEle] = useState(""); // 전달요금 현재일자
  const [treeEle, setTreeEle] = useState(""); // 전년동월요금 현재일자


  useEffect(() => {
    if (eleData !== null && combinData !== null) {
       console.log(eleData); // 업데이트된 값이 출력됩니다.
       console.log(combinData); // 업데이트된 값이 출력됩니다.
       console.log(labels);
       console.log(values);
    }    
  }, [eleData, combinData]);  

  
  useEffect(()=> {
    const loadSessionData = async () => {
      try {
        const token = await loadSession();
        if(token){
          console.log(token);     
          // 보낼 데이터 양식.
          const reqCombineData = {
            eleUsageVO: {
              memId: token,    
            },
            typeEleVO: {
              memId: token,
            },
          };        
          const reqEachData = {
            memId: token
          } 
          const reqBillData = token
           
          // 오늘의 전력사용량
          const req1 = await axios.post(domain1, reqCombineData,{
          headers:{
            'Content-Type': 'application/json',
            Authorization: `${token}`
          },
          });
          //가전별
          const req2 = await axios.post(domain2, reqEachData,{
            headers:{
              'Content-Type': 'application/json',
              Authorization: `${token}`
            },
            });
            // 요금
          const req3 = await axios.post(domain3, reqBillData,{
            headers:{
              'Content-Type': 'application/json',
              Authorization: `${token}`
            },
          })
            // 병렬처리 
            Promise.all([req1, req2, req3])
            .then(([res1, res2, res3]) => {
              // 응답 처리
              console.log('응답 1:', res1.data);

              // eachEle 차트 변수
              let labels = []; // 적절한 데이터 속성으로 수정
              let values = [];         
              let count = 0;
              let entries = Object.entries(res2.data);
              let entries2 = Object.entries(res1.data);
              entries = entries.map(entry => [entry[0], parseFloat(entry[1])]);
              let OrderEntries = entries.slice().sort((a, b) => b[1] - a[1]);
              for (let i = 2; i < OrderEntries.length; i++) {        	 
                if(entries[i][1] === 0 || entries[i].length === 0){
                  continue;
                }
                count++;
                if(count >= 4){
                  break;
                }
                  let [key, value] = entries[i];
                  console.log(key + ':' + value);
                  
                  if(key === 'dt'){
                    key = 'Computer'
                  }
                  if(key === 'otherAppliances'){
                    key = '생활가전'
                  }
                  
                  labels.push(key);
                  values.push(value);
              }
              console.log("ent",OrderEntries, entries2);
              console.log(labels, values);
              console.log('응답 2:', res2.data);
              setValues(values);
              setLabels(labels);
              
              // 요금 조회
              console.log('bill', res3.data);
              let cBill = res3.data.currentBill;
              let pmBill = res3.data.preMonthBill;
              let lyBill = res3.data.lastYearBill;		  
              let currentDate = new Date();
              let day = currentDate.getDate(); //오늘날짜
              if(cBill < 1030){
                cBill = 0;
              }
              // 이번 달의 마지막 날짜 구하기
              var lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              var daysInCurrentMonth = lastDayOfMonth.getDate();

              // 저번 달의 마지막 날짜 구하기
              var lastDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
              var daysInPreviousMonth = lastDayOfPreviousMonth.getDate();

              // 작년 이번 달의 마지막 날짜 구하기
              var lastDayOfLastYearMonth = new Date(currentDate.getFullYear() - 1, currentDate.getMonth() + 1, 0);
              var daysInLastYearMonth = lastDayOfLastYearMonth.getDate();

              let cul1 = Math.abs(Math.round(cBill - (pmBill/daysInPreviousMonth)*day)); // 이전달 현재일자까지의 요금
		          let cul2 = Math.abs(Math.round(cBill - (lyBill/daysInLastYearMonth)*day)); // 작년동월의 현재일자까지의 요금

              setMybill(cBill)
              setPMybill(cul1)
              setLyMybill(cul2)              


              // 오늘의 전력량
              setCombineData(res1.data)
              const todayValue = [];
              let myEleValue = res1.data.eleUsageVO;
	    	      let typeEleVal = res1.data.typeEleVO;
              todayValue.push((Number(myEleValue.totalEle)) * 1000)
              todayValue.push((Number(typeEleVal.averageValue)) * 1000)
              todayValue.push((Number(typeEleVal.maxValue)) * 1000)
              todayValue.push((Number(typeEleVal.minValue)) * 1000)
              setTodayEle(todayValue)
              
              // 탄소계산기
               // 탄소계산기  
         let DayEle = 0;
         // 값을 다더해줘서 오늘의 전력량 하단에 맵핑해주는 반복문
         for (let i = 2; i < OrderEntries.length; i++) {        	        	        	 
             let [key, value] = entries[i];
             DayEle += value;
             console.log(DayEle)
                        	
         }         
        

         setKele(Math.round(DayEle) + " kWh");
         setCo2Ele(Math.round(DayEle * 4.781)+ " KG");
         setTreeEle(Math.round(DayEle * 1.157)+ " 그루");

         // 절댓값으로 바꾸고 반올림까지해서 소수점을 없애버림
         DayEle = Math.round(Math.abs(DayEle * 1000));
         
         setWele(Math.round(DayEle) + " W");
         
    


              setEleData(res2.data);                 
            })
            .catch(error => {
              // 오류 처리
              console.error('오류:', error);
            });

        }else{
          console.log('token not found');
        }
      } catch (error) {
        console.error('error session', error);
      }
    };
    loadSessionData();
  }, []);

  if(values.length > 0 && labels.length > 0){
    const colors = ['#EE5656', '#3857BC', '#61CE5B', '#F3DA49', '#AE7DF0'];  
    console.log(values, labels);
    // 두 배열을 조합하여 객체 배열 생성
  const eachData = values.map((value, index) => ({
    name: labels[index],
    value: value,
    color: colors[index % colors.length],
    legendFontColor: "#7F7F7F",
    legendFontSize: 10
  }));  
  const todayData = {
    labels: ["MyEle", "AVG", "Max", "Min"],
    datasets: [
      {
        data: todayEle
      }
    ]
  };
  const screenWidth = Dimensions.get("window").width;
  const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false // optional
  };
  

    return (
      <View >
        <Center style={{ marginTop: 20 }}>
          <Heading>오늘의 전력사용량</Heading>         
        
          <View style={{ padding: 10, backgroundColor: "rgb(229,229,229)", zIndex:-1,width:327, borderRadius:30 , marginTop:10}}>
          <BarChart
              // style={graphStyle}
              data={todayData}
              width={310}
              height={220}
              yAxisSuffix=" W"
              chartConfig={chartConfig}
              verticalLabelRotation={30}     
              style={{ marginTop: 20 }}       
            />
            <Center><Text style={{marginTop:10, fontSize: 25, fontWeight: 700, color:'black'}}>{wele}</Text></Center> 
            </View>
        </Center>
        <Center style={{ marginTop: 20 }} >
          <Heading >이번달 납부요금</Heading>
          <View style={{padding: 10,backgroundColor: "#6889FF", zIndex:-1, borderRadius:30, width:327, height:120, marginTop:10, paddingTop:30}}>
          <Text style={{color: 'white', fontWeight:700}}>현재 요금: {mybill}원</Text>
          <Text style={{color: 'white', fontWeight:700}}>전달 요금: {myPbill}원 절약중</Text>
          <Text style={{color: 'white', fontWeight:700}}>전년동월 요금: {myLybill}원 절약중</Text>
          </View>
        </Center>        
        <Center style={{ marginTop: 20 }}>
          <Heading>가전별 전력량</Heading>    
          <View style={{ padding: 10, backgroundColor: "rgb(224,242,254)", zIndex:-1,width:327, borderRadius:30 , marginTop:10 }}>
        <PieChart
          data={eachData}
          width={310}
          height={200}
          chartConfig={chartConfig}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={{ marginVertical: 12 }}
        />
        </View>    
      </Center>
      <Center style={{ marginTop: 20 }}>
          <Heading>탄소 계산기</Heading>    
          <View style={{ padding: 10, backgroundColor: "#03C75A", zIndex:-1,width:327, borderRadius:30 , marginTop:10 }}>
            <Text style={{color: 'white', fontWeight:700}}> 전기 사용량: {myKele}</Text>
            <Text style={{color: 'white', fontWeight:700}}> CO2 발생량: {co2Ele}</Text>
            <Text style={{color: 'white', fontWeight:700}} > 필요 소나무: {treeEle}</Text>                                                           
          </View>
       </Center>
    </View>
    );
  }else{
    return (
      <View>
        <Text>로딩중..</Text>   
        <Spinner size="large"></Spinner>
      </View>
    );
  }  
};

const loadSession = async ()=> {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('세션 불러오기 실패');
    return null;
  }
}


export default Main;  // 컴포넌트를 올바르게 내보냄
