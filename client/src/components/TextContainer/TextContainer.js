import React from 'react';

import onlineIcon from '../../icons/onlineIcon.png';
import './TextContainer.css'
const TextContainer = ({ users }) => (
  <div className="textContainer">
    <div>
      <h1>Realtime Chat App <span role="img" aria-label="emoji">💬</span></h1>
      <h2>Created by Xiaohua Cai <span role="img" aria-label="emoji">👩</span></h2>
      <h2>Created with React, Express, Node.js and Socket.IO <span role="img" aria-label="emoji">❤️</span></h2>
      <h2>Try it out now! <span role="img" aria-label="emoji">⬅️</span></h2>
    </div>
    {
      users
        ? (
          <div>
            <h1>Currently, people are chatting!</h1>
            <div className="activeContainer">
              <h2>
                {users.map(({name}) => (
                  <div key={name} className="activeItem">
                  
                    <img alt="Online Icon" src={onlineIcon}/>
                    &nbsp;
                    {name}
                  </div>
                ))}
              </h2>
            </div>
          </div>
        )
        : null
    }
  </div>
);

export default TextContainer;