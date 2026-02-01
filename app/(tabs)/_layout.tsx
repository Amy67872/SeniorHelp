import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Dimensions, Alert, Linking, KeyboardAvoidingView, Platform, Keyboard, Image } from 'react-native';
import * as Speech from 'expo-speech';
import * as Contacts from 'expo-contacts';
import { Accelerometer } from 'expo-sensors';

const { width } = Dimensions.get('window');

export default function MemoryKeeper() {
  const [currentView, setCurrentView] = useState('setup');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [weather, setWeather] = useState('Loading...');
  const [lastResetDate, setLastResetDate] = useState(new Date().toDateString());
  const [contacts, setContacts] = useState([]);
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('');
  const [steps, setSteps] = useState(0);
  const [lastResetStepsDate, setLastResetStepsDate] = useState(new Date().toDateString());
  const [weatherAlert, setWeatherAlert] = useState('');
  const [weatherSuggestion, setWeatherSuggestion] = useState('');
  const [fallDetected, setFallDetected] = useState(false);
  const [lastFallTime, setLastFallTime] = useState(0);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [newRoutineTask, setNewRoutineTask] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('');
  const [notifiedMedications, setNotifiedMedications] = useState([]);
  const [hasShown2000Steps, setHasShown2000Steps] = useState(false);
  
  const nameInputRef = useRef(null);
  const ageInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    age: '',
    address: '',
    phone: '',
    emergencyContact: ''
  });

  const [medications, setMedications] = useState([
    { id: 1, name: 'Morning Pill', time: '8:00 AM', taken: false },
    { id: 2, name: 'Afternoon Pill', time: '2:00 PM', taken: false },
    { id: 3, name: 'Evening Pill', time: '6:00 PM', taken: false }
  ]);

  const [dailyRoutine, setDailyRoutine] = useState([
    { id: 1, task: 'Wake up', time: '7:00 AM', done: false },
    { id: 2, task: 'Brush teeth', time: '7:15 AM', done: false },
    { id: 3, task: 'Take morning medication', time: '7:30 AM', done: false },
    { id: 4, task: 'Eat breakfast', time: '8:00 AM', done: false },
    { id: 5, task: 'Get dressed', time: '8:30 AM', done: false },
    { id: 6, task: 'Morning walk', time: '9:00 AM', done: false },
    { id: 7, task: 'Read newspaper', time: '10:00 AM', done: false },
    { id: 8, task: 'Lunch', time: '12:00 PM', done: false },
    { id: 9, task: 'Afternoon rest', time: '1:00 PM', done: false },
    { id: 10, task: 'Take afternoon medication', time: '2:00 PM', done: false },
    { id: 11, task: 'Light exercise', time: '3:00 PM', done: false },
    { id: 12, task: 'Dinner', time: '6:00 PM', done: false },
    { id: 13, task: 'Take evening medication', time: '6:30 PM', done: false },
    { id: 14, task: 'Watch TV', time: '7:00 PM', done: false },
    { id: 15, task: 'Brush teeth', time: '9:00 PM', done: false },
    { id: 16, task: 'Go to bed', time: '10:00 PM', done: false },
  ]);

  const familyMembers = [
    { name: 'Sarah', role: 'Daughter', photo: '👧', phone: '1234567890' },
    { name: 'Michael', role: 'Son', photo: '👦', phone: '0987654321' },
    { name: 'Emma', role: 'Granddaughter', photo: '👶', phone: '5551234567' },
    { name: 'Dr. Johnson', role: 'Doctor', photo: '👨‍⚕️', phone: '5559876543' }
  ];

  const mapDestinations = [
    { name: 'Home', emoji: '🏠', address: userInfo.address || 'Your home address' },
    { name: 'Shopping Center', emoji: '🛒', address: 'Nearest mall' },
    { name: 'Hospital', emoji: '🏥', address: 'Local hospital' },
    { name: 'Pharmacy', emoji: '💊', address: 'Nearby pharmacy' }
  ];

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const date = now.getDate();
      const year = now.getFullYear();
      
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      
      setCurrentDate(`${dayName}, ${monthName} ${date}, ${year}`);
      setCurrentTime(`${hours}:${minutesStr} ${ampm}`);
      
      const todayDateString = now.toDateString();
      if (todayDateString !== lastResetDate) {
        setMedications(medications.map(med => ({...med, taken: false})));
        setDailyRoutine(dailyRoutine.map(task => ({...task, done: false})));
        setLastResetDate(todayDateString);
        setNotifiedMedications([]);
        setHasShown2000Steps(false);
      }
      
      if (todayDateString !== lastResetStepsDate) {
        setSteps(0);
        setLastResetStepsDate(todayDateString);
        setHasShown2000Steps(false);
      }
      
      const currentTimeStr = `${hours}:${minutesStr} ${ampm}`;
      medications.forEach(med => {
        if (med.time === currentTimeStr && !med.taken && !notifiedMedications.includes(med.id)) {
          setNotifiedMedications(prev => [...prev, med.id]);
          speakText(`Time for your medication: ${med.name}`);
          Alert.alert(
            '💊 Medication Reminder',
            `It's time to take your ${med.name}!`,
            [{ text: 'OK', onPress: () => {} }]
          );
        }
      });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [lastResetDate, lastResetStepsDate, medications, notifiedMedications]);

  useEffect(() => {
    fetch('https://wttr.in/Sydney?format=%C+%t')
      .then(response => response.text())
      .then(data => {
        setWeather(data);
        
        const temp = parseInt(data.match(/\d+/)?.[0] || 0);
        const condition = data.toLowerCase();
        
        setWeatherAlert('');
        setWeatherSuggestion('');
        
        if (temp > 35) {
          setWeatherAlert("🌡️ It's extremely hot today!");
          setWeatherSuggestion("Stay indoors if possible. Drink lots of water. Wear light, loose clothing. Use sunscreen if you go out.");
          speakText("Warning: It's extremely hot today. Please stay cool and drink plenty of water.");
        } else if (temp > 30) {
          setWeatherSuggestion("🌞 It's quite warm! Wear light clothing, stay hydrated, and seek shade when outside.");
        } else if (temp > 25) {
          setWeatherSuggestion("☀️ Nice warm weather! Perfect for a walk. Don't forget your hat and water bottle.");
        } else if (temp >= 20) {
          setWeatherSuggestion("😊 Pleasant weather today! Great for outdoor activities. Wear comfortable clothing.");
        } else if (temp >= 15) {
          setWeatherSuggestion("🍂 A bit cool today. Consider wearing a light jacket when you go out.");
        } else if (temp >= 10) {
          setWeatherSuggestion("🧥 It's chilly! Wear a warm jacket and maybe a scarf to stay comfortable.");
        } else if (temp >= 5) {
          setWeatherAlert("❄️ It's quite cold today!");
          setWeatherSuggestion("Bundle up! Wear multiple layers, a warm coat, gloves, and a hat. Stay warm indoors when possible.");
          speakText("Warning: It's cold today. Please dress warmly with layers and a coat.");
        } else {
          setWeatherAlert("🥶 It's very cold today!");
          setWeatherSuggestion("Stay inside if possible. If you must go out, wear very warm clothes - coat, hat, gloves, scarf, and warm boots.");
          speakText("Warning: It's very cold today. Please stay warm and dress in layers.");
        }
        
        if (condition.includes('rain') || condition.includes('shower')) {
          setWeatherAlert("☔ Rain expected today!");
          setWeatherSuggestion("Take an umbrella! Wear waterproof clothing and non-slip shoes. Be careful of slippery surfaces.");
          speakText("Warning: Rain is expected today. Don't forget your umbrella.");
        } else if (condition.includes('storm') || condition.includes('thunder')) {
          setWeatherAlert("⛈️ Storms expected today!");
          setWeatherSuggestion("Stay indoors if possible. Avoid going out during the storm. Keep your phone charged.");
          speakText("Warning: Storms expected today. Please stay safe indoors.");
        } else if (condition.includes('snow')) {
          setWeatherAlert("🌨️ Snow expected today!");
          setWeatherSuggestion("Dress very warmly! Wear non-slip boots. Be very careful of icy surfaces. Stay inside if you can.");
          speakText("Warning: Snow expected today. Please be careful and stay warm.");
        } else if (condition.includes('wind')) {
          setWeatherSuggestion("💨 It's windy today! Wear a windbreaker or jacket. Hold onto your hat! Be careful with balance.");
        } else if (condition.includes('fog')) {
          setWeatherSuggestion("🌫️ Foggy conditions today. Be extra careful when walking or driving. Use caution crossing streets.");
        } else if (condition.includes('cloud')) {
          setWeatherSuggestion("☁️ Cloudy weather today. A good day for indoor or outdoor activities. Bring a light jacket just in case.");
        } else if (condition.includes('clear') || condition.includes('sunny')) {
          if (temp > 25) {
            setWeatherSuggestion("☀️ Beautiful sunny day! Wear sunscreen, sunglasses, and a hat if going outside.");
          }
        }
      })
      .catch(() => setWeather('Unable to fetch weather'));
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        if (data.length > 0) {
          const contactsWithPhones = data
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .map(contact => ({
              name: contact.name,
              phone: contact.phoneNumbers[0].number,
              id: contact.id
            }));
          setContacts(contactsWithPhones);
        }
      }
    })();
  }, []);

  useEffect(() => {
    let subscription;
    let stepCount = 0;
    let lastY = 0;
    
    Accelerometer.setUpdateInterval(100);
    
    subscription = Accelerometer.addListener(accelerometerData => {
      const { y } = accelerometerData;
      const threshold = 0.3;
      
      if (Math.abs(y - lastY) > threshold) {
        stepCount++;
        if (stepCount % 10 === 0) {
          setSteps(prev => {
            const newSteps = prev + 1;
            
            if (newSteps >= 2000 && !hasShown2000Steps) {
              setHasShown2000Steps(true);
              speakText('Congratulations! You have reached your goal of 2000 steps today! Great job keeping active!');
              Alert.alert(
                '🎉 Goal Reached!',
                'Amazing! You\'ve walked 2000 steps today! Keep up the great work!',
                [{ text: 'Awesome!', onPress: () => {} }]
              );
            }
            
            return newSteps;
          });
        }
      }
      lastY = y;
      
      const magnitude = Math.sqrt(
        accelerometerData.x ** 2 + 
        accelerometerData.y ** 2 + 
        accelerometerData.z ** 2
      );
      
      if (magnitude > 2.5) {
        setFallDetected(true);
        setTimeout(() => {
          Alert.alert(
            '🚨 Fall Detected!',
            'Are you okay? Press OK if you are fine, or Cancel to call emergency contact.',
            [
              { 
                text: "I'm OK", 
                onPress: () => setFallDetected(false),
                style: 'cancel'
              },
              { 
                text: 'Call Help', 
                onPress: () => {
                  setFallDetected(false);
                  if (userInfo.emergencyContact) {
                    Linking.openURL(`tel:${userInfo.emergencyContact}`);
                  } else {
                    Linking.openURL('tel:000');
                  }
                }
              }
            ]
          );
        }, 2000);
      }
    });
    
    return () => subscription && subscription.remove();
  }, [userInfo.emergencyContact, hasShown2000Steps]);

  const speakText = (text) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.75,
    });
  };

  const makePhoneCall = (phoneNumber, name) => {
    Alert.alert(
      `Call ${name}?`,
      `Do you want to call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          }
        }
      ]
    );
  };

  const markMedicationTaken = (id) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, taken: !med.taken } : med
    ));
    speakText('Medication marked as taken');
  };

  const addMedication = () => {
    if (newMedName && newMedTime) {
      const newMed = {
        id: Date.now(),
        name: newMedName,
        time: newMedTime,
        taken: false
      };
      setMedications([...medications, newMed]);
      setNewMedName('');
      setNewMedTime('');
      setShowAddMed(false);
      speakText(`Added ${newMedName} at ${newMedTime}`);
    } else {
      Alert.alert('Missing Information', 'Please enter both medication name and time');
    }
  };

  const deleteMedication = (id) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            setMedications(medications.filter(med => med.id !== id));
            speakText('Medication deleted');
          },
          style: 'destructive'
        }
      ]
    );
  };

  const openMap = (destination) => {
    const address = destination.address === 'Your home address' && userInfo.address 
      ? userInfo.address 
      : destination.name;
    const url = `maps://app?daddr=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const triggerSOS = () => {
    Alert.alert(
      '🆘 SOS ALERT',
      'Call emergency contact now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'CALL NOW', 
          onPress: () => {
            if (userInfo.emergencyContact) {
              Linking.openURL(`tel:${userInfo.emergencyContact}`);
            } else {
              Linking.openURL('tel:000');
            }
            speakText('Calling emergency contact');
          }
        }
      ]
    );
  };

  const toggleRoutineTask = (id) => {
    setDailyRoutine(dailyRoutine.map(task =>
      task.id === id ? { ...task, done: !task.done } : task
    ));
    const task = dailyRoutine.find(t => t.id === id);
    if (task && !task.done) {
      speakText(`${task.task} completed`);
    }
  };

  const addRoutineTask = () => {
    if (newRoutineTask.trim() && newRoutineTime.trim()) {
      const newTask = {
        id: Date.now(),
        task: newRoutineTask,
        time: newRoutineTime,
        done: false
      };
      setDailyRoutine([...dailyRoutine, newTask]);
      setNewRoutineTask('');
      setNewRoutineTime('');
      setShowAddRoutine(false);
      speakText(`Added ${newRoutineTask} at ${newRoutineTime} to your routine`);
    } else {
      Alert.alert('Missing Information', 'Please enter both task name and time');
    }
  };

  const deleteRoutineTask = (id) => {
    Alert.alert(
      'Delete Task',
      'Remove this task from your routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            setDailyRoutine(dailyRoutine.filter(task => task.id !== id));
            speakText('Task removed from routine');
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0FDFA' }}>
      {currentView === 'setup' && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.setupHeader}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Image 
                    source={require('@/assets/images/logo.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={styles.setupTitle}>Welcome to</Text>
              <Text style={styles.appName}>SeniorHelp</Text>
              <Text style={styles.setupSubtitle}>Set up your profile</Text>
              
              <TouchableOpacity 
                style={styles.readButton}
                onPress={() => speakText('Welcome to SeniorHelp! Please enter your name, age, address, and phone number.')}
              >
                <Text style={styles.readButtonText}>🔊 READ PAGE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Your Name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={userInfo.name}
                onChangeText={(text) => setUserInfo(prev => ({...prev, name: text}))}
                autoCorrect={false}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Your Age:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                value={userInfo.age}
                onChangeText={(text) => setUserInfo(prev => ({...prev, age: text}))}
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Your Address:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your address"
                value={userInfo.address}
                onChangeText={(text) => setUserInfo(prev => ({...prev, address: text}))}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Your Phone:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone"
                value={userInfo.phone}
                onChangeText={(text) => setUserInfo(prev => ({...prev, phone: text}))}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Emergency Contact:</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter emergency contact number"
                value={userInfo.emergencyContact}
                onChangeText={(text) => setUserInfo(prev => ({...prev, emergencyContact: text}))}
                keyboardType="phone-pad"
              />

              <TouchableOpacity 
                style={styles.setupButton}
                onPress={() => {
                  if (userInfo.name && userInfo.age) {
                    Keyboard.dismiss();
                    speakText(`Welcome ${userInfo.name}! Your profile is ready.`);
                    setCurrentView('home');
                  } else {
                    speakText('Please enter at least your name and age');
                    Alert.alert('Missing Info', 'Please enter at least your name and age');
                  }
                }}
              >
                <Text style={styles.setupButtonText}>START USING APP</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      
      {currentView === 'home' && (
        <ScrollView style={styles.container}>
          <TouchableOpacity 
            style={styles.floatingReadButton}
            onPress={() => speakText(`Hello ${userInfo.name}! Today is ${currentDate}. The time is ${currentTime}. Weather: ${weather}. You have walked ${steps} steps today.`)}
          >
            <Text style={styles.floatingReadButtonText}>🔊</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoSmall}>
                <Image 
                  source={require('@/assets/images/logo.png')} 
                  style={styles.logoImageSmall}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.appNameHome}>SeniorHelp</Text>
            <Text style={styles.title}>Hello {userInfo.name || 'Friend'}!</Text>
            <Text style={styles.subtitle}>{currentDate}</Text>
            <Text style={styles.time}>{currentTime}</Text>
            <Text style={styles.weather}>{weather}</Text>
            <View style={styles.stepsCard}>
              <Text style={styles.stepsText}>👣 {steps} steps today</Text>
              <Text style={styles.stepsGoal}>Goal: 2000 steps</Text>
            </View>
          </View>

          {weatherAlert && (
            <View style={styles.weatherAlertBox}>
              <Text style={styles.weatherAlertText}>{weatherAlert}</Text>
              <TouchableOpacity onPress={() => setWeatherAlert('')}>
                <Text style={styles.weatherAlertClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {weatherSuggestion && (
            <View style={styles.weatherSuggestionBox}>
              <Text style={styles.weatherSuggestionText}>{weatherSuggestion}</Text>
              <TouchableOpacity onPress={() => setWeatherSuggestion('')}>
                <Text style={styles.weatherSuggestionClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.emergencyBoxHome}>
            <Text style={styles.emergencyTitleHome}>🚨 EMERGENCY</Text>
            <TouchableOpacity 
              style={styles.emergencyButtonHome}
              onPress={() => {
                Alert.alert(
                  'Emergency Call',
                  'Call 000 now?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Call 000', onPress: () => Linking.openURL('tel:000') }
                  ]
                );
              }}
            >
              <Text style={styles.emergencyButtonTextHome}>CALL 000</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonGrid}>
            <TouchableOpacity 
              style={[styles.bigButton, {backgroundColor: '#14B8A6'}]} 
              onPress={() => {
                speakText('Opening call screen');
                setCurrentView('call');
              }}
            >
              <Text style={styles.buttonIcon}>📞</Text>
              <Text style={styles.buttonText}>CALL</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bigButton, {backgroundColor: '#5EEAD4'}]} 
              onPress={() => {
                speakText('Opening your information');
                setCurrentView('info');
              }}
            >
              <Text style={styles.buttonIcon}>ℹ️</Text>
              <Text style={styles.buttonText}>INFO</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bigButton, {backgroundColor: '#2DD4BF'}]} 
              onPress={() => {
                speakText('Opening medications');
                setCurrentView('medication');
              }}
            >
              <Text style={styles.buttonIcon}>💊</Text>
              <Text style={styles.buttonText}>MEDS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bigButton, {backgroundColor: '#99F6E4'}]} 
              onPress={() => {
                speakText('Opening maps');
                setCurrentView('map');
              }}
            >
              <Text style={styles.buttonIcon}>🗺️</Text>
              <Text style={styles.buttonText}>MAP</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bigButton, {backgroundColor: '#0D9488'}]} 
              onPress={() => {
                speakText('Opening daily routine');
                setCurrentView('routine');
              }}
            >
              <Text style={styles.buttonIcon}>✅</Text>
              <Text style={styles.buttonText}>ROUTINE</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bigButton, {backgroundColor: '#14B8A6'}]} 
              onPress={() => {
                speakText(`You have walked ${steps} steps today. Keep going!`);
              }}
            >
              <Text style={styles.buttonIcon}>👣</Text>
              <Text style={styles.buttonText}>{steps} STEPS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      
      {currentView === 'call' && (
        <ScrollView style={styles.container}>
          <TouchableOpacity 
            style={styles.floatingReadButton}
            onPress={() => speakText(contacts.length > 0 ? 'Call someone from your contacts' : 'Call someone or dial 911 for emergency')}
          >
            <Text style={styles.floatingReadButtonText}>🔊</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <Text style={styles.backButtonText}>← HOME</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>📞 Call Someone</Text>

          {contacts.length > 0 ? (
            <View>
              <Text style={styles.sectionHeader}>Your Contacts</Text>
              <View style={styles.callGrid}>
                {contacts.slice(0, 12).map((contact) => (
                  <TouchableOpacity 
                    key={contact.id} 
                    style={styles.contactCard}
                    onPress={() => makePhoneCall(contact.phone, contact.name)}
                  >
                    <Text style={styles.contactEmoji}>👤</Text>
                    <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
                    <View style={styles.callNowButton}>
                      <Text style={styles.callNowText}>CALL</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionHeader}>Quick Contacts</Text>
              <View style={styles.callGrid}>
                {familyMembers.map((person, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.contactCard}
                    onPress={() => makePhoneCall(person.phone, person.name)}
                  >
                    <Text style={styles.contactEmoji}>{person.photo}</Text>
                    <Text style={styles.contactName}>{person.name}</Text>
                    <Text style={styles.contactRole}>{person.role}</Text>
                    <View style={styles.callNowButton}>
                      <Text style={styles.callNowText}>CALL</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.emergencyBox}>
            <Text style={styles.emergencyTitle}>🚨 EMERGENCY</Text>
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={() => {
                Alert.alert(
                  'Emergency Call',
                  'Call 000 now?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Call 000', onPress: () => Linking.openURL('tel:000') }
                  ]
                );
              }}
            >
              <Text style={styles.emergencyButtonText}>CALL 000</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      
      {currentView === 'info' && (
        <ScrollView style={styles.container}>
          <TouchableOpacity 
            style={styles.floatingReadButton}
            onPress={() => speakText(`Your information. Name: ${userInfo.name}. Age: ${userInfo.age}. Address: ${userInfo.address}. Phone: ${userInfo.phone}. Today is ${currentDate}.`)}
          >
            <Text style={styles.floatingReadButtonText}>🔊</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <Text style={styles.backButtonText}>← HOME</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>ℹ️ Your Information</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About You:</Text>
            <Text style={styles.infoText}>
              <Text style={{fontWeight: 'bold'}}>Name:</Text> {userInfo.name || 'Not set'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={{fontWeight: 'bold'}}>Age:</Text> {userInfo.age || 'Not set'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={{fontWeight: 'bold'}}>Address:</Text> {userInfo.address || 'Not set'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={{fontWeight: 'bold'}}>Phone:</Text> {userInfo.phone || 'Not set'}
            </Text>
            <Text style={styles.infoText}>
              <Text style={{fontWeight: 'bold'}}>Today:</Text> {currentDate}
            </Text>
            <Text style={styles.infoText}>
              <Text style={{fontWeight: 'bold'}}>Time:</Text> {currentTime}
            </Text>

            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                speakText('Opening setup to edit your information');
                setCurrentView('setup');
              }}
            >
              <Text style={styles.editButtonText}>EDIT INFO</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      
      {currentView === 'medication' && (
        <ScrollView style={styles.container}>
          <TouchableOpacity 
            style={styles.floatingReadButton}
            onPress={() => {
              const medList = medications.map(m => `${m.name} at ${m.time}, ${m.taken ? 'already taken' : 'not taken yet'}`).join('. ');
              speakText(`Your medications. ${medList}`);
            }}
          >
            <Text style={styles.floatingReadButtonText}>🔊</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <Text style={styles.backButtonText}>← HOME</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>💊 Your Medications</Text>

          {medications.map((med) => (
            <View key={med.id} style={[styles.medCard, med.taken && styles.medCardTaken]}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medTime}>⏰ {med.time}</Text>
              </View>
              <View style={styles.medButtons}>
                <TouchableOpacity 
                  style={[styles.medButton, med.taken && styles.medButtonTaken]}
                  onPress={() => markMedicationTaken(med.id)}
                >
                  <Text style={styles.medButtonText}>{med.taken ? '✓' : 'TAKE'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteMedication(med.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {showAddMed ? (
            <View style={styles.addMedCard}>
              <Text style={styles.addMedTitle}>Add New Medication</Text>
              <TextInput
                style={styles.medInput}
                placeholder="Medication name"
                value={newMedName}
                onChangeText={setNewMedName}
                fontSize={24}
              />
              <TextInput
                style={styles.medInput}
                placeholder="Time (e.g., 8:00 AM)"
                value={newMedTime}
                onChangeText={setNewMedTime}
                fontSize={24}
              />
              <View style={styles.addMedButtons}>
                <TouchableOpacity 
                  style={[styles.addMedButton, {backgroundColor: '#14B8A6'}]}
                  onPress={addMedication}
                >
                  <Text style={styles.addMedButtonText}>ADD</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.addMedButton, {backgroundColor: '#EF4444'}]}
                  onPress={() => {
                    setShowAddMed(false);
                    setNewMedName('');
                    setNewMedTime('');
                  }}
                >
                  <Text style={styles.addMedButtonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addNewMedButton}
              onPress={() => {
                speakText('Add new medication');
                setShowAddMed(true);
              }}
            >
              <Text style={styles.addNewMedText}>+ ADD NEW MEDICATION</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.resetMedsButton}
            onPress={() => {
              setMedications(medications.map(med => ({...med, taken: false})));
              speakText('All medications reset for today');
            }}
          >
            <Text style={styles.resetMedsText}>RESET ALL FOR TODAY</Text>
          </TouchableOpacity>

          <View style={styles.autoResetInfo}>
            <Text style={styles.autoResetText}>ℹ️ Medications auto-reset at midnight</Text>
          </View>
        </ScrollView>
      )}
      
      {currentView === 'map' && (
        <ScrollView style={styles.container}>
          <TouchableOpacity 
            style={styles.floatingReadButton}
            onPress={() => speakText('Get directions. Tap a location to open in Maps.')}
          >
            <Text style={styles.floatingReadButtonText}>🔊</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <Text style={styles.backButtonText}>← HOME</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>🗺️ Get Directions</Text>

          <View style={styles.mapInfo}>
            <Text style={styles.mapInfoText}>Tap a location to open in Maps</Text>
          </View>

          {mapDestinations.map((dest, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.mapCard}
              onPress={() => {
                speakText(`Opening directions to ${dest.name}`);
                openMap(dest);
              }}
            >
              <Text style={styles.mapEmoji}>{dest.emoji}</Text>
              <View style={styles.mapTextContainer}>
                <Text style={styles.mapName}>{dest.name}</Text>
                <Text style={styles.mapAddress}>{dest.address}</Text>
              </View>
              <Text style={styles.mapArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      {currentView === 'routine' && (
        <ScrollView style={styles.container}>
          <TouchableOpacity 
            style={styles.floatingReadButton}
            onPress={() => {
              const completedCount = dailyRoutine.filter(t => t.done).length;
              const tasks = dailyRoutine.map(t => `${t.task} at ${t.time}, ${t.done ? 'completed' : 'not done yet'}`).join('. ');
              speakText(`Your daily routine. ${completedCount} of ${dailyRoutine.length} tasks completed. ${tasks}`);
            }}
          >
            <Text style={styles.floatingReadButtonText}>🔊</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('home')}>
            <Text style={styles.backButtonText}>← HOME</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>✅ Daily Routine</Text>

          <View style={styles.routineProgress}>
            <Text style={styles.routineProgressText}>
              {dailyRoutine.filter(t => t.done).length} of {dailyRoutine.length} completed
            </Text>
          </View>

          {dailyRoutine.map((task) => (
            <View key={task.id} style={[styles.routineCard, task.done && styles.routineCardDone]}>
              <TouchableOpacity
                style={styles.routineMainContent}
                onPress={() => toggleRoutineTask(task.id)}
              >
                <View style={styles.routineCheckbox}>
                  <Text style={styles.routineCheckboxText}>{task.done ? '✓' : ''}</Text>
                </View>
                <View style={styles.routineTaskContent}>
                  <Text style={[styles.routineTaskText, task.done && styles.routineTaskTextDone]}>
                    {task.task}
                  </Text>
                  <Text style={styles.routineTaskTime}>⏰ {task.time}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.routineDeleteButton}
                onPress={() => deleteRoutineTask(task.id)}
              >
                <Text style={styles.routineDeleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          {showAddRoutine ? (
            <View style={styles.addRoutineCard}>
              <Text style={styles.addRoutineTitle}>Add New Task</Text>
              <TextInput
                style={styles.routineInput}
                placeholder="Task name (e.g., Take vitamins)"
                value={newRoutineTask}
                onChangeText={setNewRoutineTask}
                fontSize={24}
              />
              <TextInput
                style={styles.routineInput}
                placeholder="Time (e.g., 3:00 PM)"
                value={newRoutineTime}
                onChangeText={setNewRoutineTime}
                fontSize={24}
              />
              <View style={styles.addRoutineButtons}>
                <TouchableOpacity 
                  style={[styles.addRoutineButton, {backgroundColor: '#14B8A6'}]}
                  onPress={addRoutineTask}
                >
                  <Text style={styles.addRoutineButtonText}>ADD</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.addRoutineButton, {backgroundColor: '#EF4444'}]}
                  onPress={() => {
                    setShowAddRoutine(false);
                    setNewRoutineTask('');
                    setNewRoutineTime('');
                  }}
                >
                  <Text style={styles.addRoutineButtonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addNewRoutineButton}
              onPress={() => {
                speakText('Add new task to your routine');
                setShowAddRoutine(true);
              }}
            >
              <Text style={styles.addNewRoutineText}>+ ADD NEW TASK</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.resetRoutineButton}
            onPress={() => {
              setDailyRoutine(dailyRoutine.map(task => ({...task, done: false})));
              speakText('Daily routine reset');
            }}
          >
            <Text style={styles.resetRoutineText}>RESET ROUTINE</Text>
          </TouchableOpacity>

          <View style={styles.autoResetInfo}>
            <Text style={styles.autoResetText}>ℹ️ Routine auto-resets at midnight</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDFA',
    padding: 16,
  },
  setupHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  logoSmall: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  logoImageSmall: {
    width: 48,
    height: 48,
  },
  setupEmoji: {
    fontSize: 80,
  },
  setupTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  appName: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#14B8A6',
    marginTop: 5,
    marginBottom: 5,
  },
  appNameHome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14B8A6',
    marginBottom: 10,
  },
  setupSubtitle: {
    fontSize: 24,
    color: '#5EEAD4',
    marginTop: 10,
  },
  readButton: {
    backgroundColor: '#14B8A6',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 50,
    marginTop: 20,
  },
  readButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  floatingReadButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#14B8A6',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingReadButtonText: {
    fontSize: 30,
  },
  stepsCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    marginTop: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  stepsGoal: {
    fontSize: 18,
    color: '#5EEAD4',
    marginTop: 5,
  },
  weatherAlertBox: {
    backgroundColor: '#CCFBF1',
    borderWidth: 2,
    borderColor: '#5EEAD4',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherAlertText: {
    fontSize: 20,
    color: '#0F766E',
    flex: 1,
  },
  weatherAlertClose: {
    fontSize: 28,
    color: '#0F766E',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  weatherSuggestionBox: {
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: '#14B8A6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherSuggestionText: {
    fontSize: 18,
    color: '#0F766E',
    flex: 1,
    lineHeight: 24,
  },
  weatherSuggestionClose: {
    fontSize: 28,
    color: '#0F766E',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  routineProgress: {
    backgroundColor: '#CCFBF1',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  routineProgressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  routineCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routineCardDone: {
    backgroundColor: '#CCFBF1',
    borderColor: '#14B8A6',
  },
  routineMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routineTaskContent: {
    flex: 1,
  },
  routineCheckbox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  routineCheckboxText: {
    fontSize: 30,
    color: '#14B8A6',
  },
  routineTaskText: {
    fontSize: 24,
    color: '#0F766E',
    fontWeight: 'bold',
  },
  routineTaskTime: {
    fontSize: 18,
    color: '#5EEAD4',
    marginTop: 4,
  },
  routineTaskTextDone: {
    textDecorationLine: 'line-through',
    color: '#5EEAD4',
  },
  routineDeleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  routineDeleteText: {
    fontSize: 20,
  },
  addRoutineCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addRoutineTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F766E',
    marginBottom: 15,
  },
  routineInput: {
    backgroundColor: '#F0FDFA',
    borderRadius: 15,
    padding: 15,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#CCFBF1',
    marginBottom: 15,
    color: '#0F766E',
  },
  addRoutineButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addRoutineButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  addRoutineButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  addNewRoutineButton: {
    backgroundColor: '#14B8A6',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  addNewRoutineText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  resetRoutineButton: {
    backgroundColor: '#99F6E4',
    padding: 18,
    borderRadius: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  resetRoutineText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  inputCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F766E',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F0FDFA',
    borderRadius: 15,
    padding: 15,
    fontSize: 28,
    borderWidth: 2,
    borderColor: '#CCFBF1',
    minHeight: 60,
    color: '#0F766E',
  },
  setupButton: {
    backgroundColor: '#14B8A6',
    padding: 20,
    borderRadius: 15,
    marginTop: 30,
    alignItems: 'center',
  },
  setupButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 60,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  subtitle: {
    fontSize: 24,
    color: '#5EEAD4',
    marginTop: 4,
  },
  time: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14B8A6',
    marginTop: 4,
  },
  weather: {
    fontSize: 20,
    color: '#5EEAD4',
    marginTop: 4,
  },
  buttonGrid: {
    gap: 12,
  },
  bigButton: {
    width: '100%',
    paddingVertical: 25,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 50,
    marginRight: 15,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 50,
    marginBottom: 15,
    marginTop: 60,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0F766E',
  },
  sectionHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F766E',
    marginBottom: 15,
    marginLeft: 5,
  },
  callGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  contactName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  contactRole: {
    fontSize: 18,
    color: '#5EEAD4',
    marginVertical: 4,
  },
  callNowButton: {
    backgroundColor: '#14B8A6',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 50,
    marginTop: 8,
  },
  callNowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  emergencyBoxHome: {
    backgroundColor: '#EF4444',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  emergencyTitleHome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  emergencyButtonHome: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 50,
  },
  emergencyButtonTextHome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  emergencyBox: {
    backgroundColor: '#EF4444',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  emergencyTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  emergencyButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F766E',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 24,
    color: '#5EEAD4',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#14B8A6',
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  medCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medCardTaken: {
    backgroundColor: '#CCFBF1',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  medTime: {
    fontSize: 20,
    color: '#5EEAD4',
    marginTop: 4,
  },
  medButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  medButton: {
    backgroundColor: '#14B8A6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  medButtonTaken: {
    backgroundColor: '#0D9488',
  },
  medButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 50,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  addMedCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addMedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F766E',
    marginBottom: 15,
  },
  medInput: {
    backgroundColor: '#F0FDFA',
    borderRadius: 15,
    padding: 15,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#CCFBF1',
    marginBottom: 15,
    color: '#0F766E',
  },
  addMedButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addMedButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  addMedButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  addNewMedButton: {
    backgroundColor: '#14B8A6',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  addNewMedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  resetMedsButton: {
    backgroundColor: '#99F6E4',
    padding: 18,
    borderRadius: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  resetMedsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  autoResetInfo: {
    backgroundColor: '#CCFBF1',
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    marginBottom: 20,
  },
  autoResetText: {
    fontSize: 18,
    color: '#0F766E',
    textAlign: 'center',
  },
  mapInfo: {
    backgroundColor: '#CCFBF1',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  mapInfoText: {
    fontSize: 20,
    color: '#0F766E',
    textAlign: 'center',
  },
  mapCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapEmoji: {
    fontSize: 50,
    marginRight: 15,
  },
  mapTextContainer: {
    flex: 1,
  },
  mapName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F766E',
  },
  mapAddress: {
    fontSize: 18,
    color: '#5EEAD4',
    marginTop: 4,
  },
  mapArrow: {
    fontSize: 35,
    color: '#14B8A6',
  },
});