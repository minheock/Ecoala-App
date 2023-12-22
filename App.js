import React, {useState} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import axios from 'axios';
import { NativeBaseProvider, Center, Box, Heading, VStack, FormControl, Input, Link, Button, HStack , Image, useToast , Menu} from 'native-base';
import AsyncStorage  from '@react-native-async-storage/async-storage'; // 세션을 사용하기위해
import Main from './page/main';
import base64 from 'base-64'; // 한글도 같이 디코딩해줌


const fromUrl = 'http://192.168.0.19:8080/app/members/userlogin'

const Stack = createStackNavigator();
//const auth0Domain = process.env.AUTH0_DOMAIN; // 보안.


export default function App() {

  return (
    <NativeBaseProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Login'
          screenOptions={{            
            cardStyle: {backgroundColor: '#fff'}
          }}>
          <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false}}
          />
          <Stack.Screen name="Main" component={Main}/>          
        </Stack.Navigator>        
      </NavigationContainer>
    </NativeBaseProvider>
  )
  }
  


 const LoginScreen = ({navigation }) => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const toast = useToast();


  const saveSession = async (token) => {
    try {
      await AsyncStorage.setItem('authToken', token)
      console.log('세션 저장 완료', token);
    } catch (error) {
      console.error('세션저장실패', error);
    }
  };


    // JWT의 payload를 디코딩하는 함수
    const decodeJWT = (token) => {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(base64.decode(payloadBase64));
        return decodedPayload;
      } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
      }
    };



  const handleLogin = async() =>{
    try {
        console.log(fromUrl);
        const url = fromUrl
        const data = {
          userId: id,
          userPw: pw,
        };
        const res = await axios.post(url, data, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log(res.data);

        if(res.status < 300){
          const result = res.data;
          console.log('로그인성공: ', result, 'id:', id);
          setId(id);
          const memId = result.memId;
          //saveSession(decodeJWT(memId))
          saveSession(memId)
          toast.show({
            duration : 2000,
            render: () => {
              return <Box bg="emerald.300" px="2" py="2" rounded="sm" mb={5}>
                      로그인에 성공하였습니다.
                    </Box>;
            }
          });
          navigation.navigate(Main)          
        }else{
          console.log('로그인 실패:', res.status, res.statusText);
          toast.show({
            duration : 2000,            
            render: () => {
              return <Box bg="danger.500" px="2" py="2" rounded="sm" mb={5}>
                      잘못된 요청입니다.
                    </Box>;
            }
          });
          
        }
    } catch (error) {      
      console.error('에러 발생:', error);
      toast.show({
        duration : 2000,            
        render: () => {
          return <Box bg="danger.500" px="2" py="2" rounded="sm" mb={5}>
                  로그인에 실패하였습니다.
                </Box>;
        }
      });
    }
  }   
  return (    
    <NativeBaseProvider >
      <Center w="100%">
      <Box safeArea p="2" py="8" w="90%" maxW="290">
      <Center>
      <Image
          source={require("./assets/Ecoala.png")} // 이미지 URL 설정
          alt="Ecoala Logo" // 대체 텍스트
          w={200} 
          h={250} 
        />     
        </Center>      
        <VStack space={3} mt="5">
          <FormControl>
            <FormControl.Label>아이디</FormControl.Label>
            <Input  
            value={id}
            onChangeText={(text) => {setId(text),console.log("입력된 아이디:", text);}}/>
          </FormControl>
          <FormControl>
            <FormControl.Label>비밀번호</FormControl.Label>
            <Input 
            type="password"  
            value={pw}
            onChangeText={(text)=> {setPw(text), console.log("입력된 비번:", text);}} />
            <Link _text={{
            fontSize: "xs",
            fontWeight: "500",
            color: "indigo.500"
          }} alignSelf="flex-end" mt="1">
              Forget Password?
            </Link>
          </FormControl>
          <Button mt="2" colorScheme="indigo" onPress={handleLogin}>
            로그인
          </Button>
          <HStack mt="6" justifyContent="center">
            <Text fontSize="sm" color="coolGray.600" _dark={{
            color: "warmGray.200"
          }}>
              I'm a new user.{" "}
            </Text>
            <Link _text={{
            color: "indigo.500",
            fontWeight: "medium",
            fontSize: "sm"
          }} href="#">
              Sign Up
            </Link>
          </HStack>
        </VStack>
      </Box>
    </Center>
      </NativeBaseProvider>     
);
}

   




