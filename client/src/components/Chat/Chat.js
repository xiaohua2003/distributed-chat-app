import React, {useState, useEffect} from 'react';
import queryString from 'query-string';
import io from 'socket.io-client';
import './Chat.css';
import InfoBar from '../InfoBar/InfoBar';
import Input from '../Input/Input';
import Messages from '../Messages/Messages';
import TextContainer from '../TextContainer/TextContainer';
let socket
const Chat=({location})=>{
    const [name, setName]=useState('');
    const [room, setRoom]=useState('');
    const [message, setMessage]=useState('');
    const [users, setUsers] = useState('');
    const [messages, setMessages]=useState([]);
    const ENDPOINT = 'http://localhost:5000';
    
    useEffect(()=>{
       const { name, room } = queryString.parse(
  location.search
); 
        const endpoint = "http://localhost:8080";
        socket = io(endpoint, {transports: ['websocket', 'polling', 'flashsocket']})
        setName(name);
        setRoom(room);
       
        socket.emit('join', {name, room}, (error)=>{
            if(error) {
                alert(error);
              }
        }); 
         return ()=>{
            socket.emit('disconnect');
            socket.off();
        } 

        
    }, [ENDPOINT, location.search])
    //handling message
  useEffect(() => {
   const handleMessage = (message) => {
    setMessages((previousMessages) => [
    ...previousMessages,
    message,
    ]);
  };

  const handleRoomData = ({ users }) => {
    setUsers(users);
  };

  socket.on('message', handleMessage);
  socket.on('roomData', handleRoomData);

  return () => {
    socket.off('message', handleMessage);
    socket.off('roomData', handleRoomData);
  };
}, []);
    //function for sending messages
    const sendMessage=(event)=>{
        event.preventDefault();
        if(message){
            socket.emit('sendMessage', message, ()=>setMessage(''))
        }
    }
    console.log(message, messages)
    return (
        <div className="outerContainer">
            <div className="container">
              <InfoBar room={room}/>
              <Messages messages={messages} name={name}/>
              <Input message={message} setMessage={setMessage} sendMessage={sendMessage}/>
            </div>
            <TextContainer users={users}/>
          
        </div>
    )
}
export default Chat;