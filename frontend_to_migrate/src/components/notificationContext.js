import React, { createContext, useState, useContext } from 'react';


const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [newNotification, setNewNotification] = useState(false);  
  const [newPractica, setNewPractica] = useState(null);  


  const addNotification = (practica) => {
    console.log("actualizo noti a true");
    setNewNotification(true);
    setNewPractica(practica);
  };

  const clearNotification = () => {
    console.log("actualizo noti a false");
    setNewNotification(false);
  };

  return (
    <NotificationContext.Provider value={{ newNotification, newPractica, addNotification, clearNotification}}>
      {children}
    </NotificationContext.Provider>
  );
};


export const useNotification = () => useContext(NotificationContext);
