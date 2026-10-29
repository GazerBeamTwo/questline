'use strict';
/* Starter packs. Node tuple: [key, title, type, category, description, prerequisiteKeys] */
const PACKS = [
  {
    id: 'fitness', name: 'Fitness Starter', tree: 'Fitness',
    blurb: 'From your first 5k to a half marathon, plus strength and mobility.',
    nodes: [
      ['walk', 'Walk 10,000 steps in a day', 'experience', 'Body', 'A full day on your feet. Notice how it feels.', []],
      ['run5k', 'Run 5k without stopping', 'experience', 'Body', 'No walking breaks. Any pace counts.', ['walk']],
      ['run10k', 'Run 10k', 'experience', 'Body', 'Double the distance. Pace yourself.', ['run5k']],
      ['half', 'Run a half marathon', 'experience', 'Body', '21.1 km, at an event or on your own route.', ['run10k']],
      ['hike', 'Hike a full-day trail', 'experience', 'Adventure', 'Pack lunch, go far, come back happily tired.', ['run5k']],
      ['strength', 'Strength training', 'skill', 'Body', 'Lift, push, pull. Every session you write about is progress.', []],
      ['pullup', 'Do a full pull-up', 'experience', 'Body', 'Chin over the bar, no swinging.', ['strength']],
      ['mobility', 'Mobility & yoga', 'skill', 'Body', 'Flexibility, balance and recovery.', []],
      ['nutrition', 'Learn the basics of nutrition', 'knowledge', 'Mind', 'Protein, carbs, fats and fibre: what they do and how much you need.', []]
    ]
  },
  {
    id: 'travel-au', name: 'Travel Australia', tree: 'Travel',
    blurb: 'Reef, rock, road and wilderness: a big-sky bucket list.',
    nodes: [
      ['snorkel', 'Learn to snorkel', 'skill', 'Adventure', 'Get comfortable in open water with a mask and fins.', []],
      ['reef', 'See the Great Barrier Reef', 'experience', 'Adventure', 'Snorkel or dive the reef.', ['snorkel']],
      ['uluru', 'Watch sunrise at Uluru', 'experience', 'Adventure', 'Uluru–Kata Tjuta at first light.', ['country']],
      ['country', 'Learn whose Country you are visiting', 'knowledge', 'Mind', 'The Traditional Owners of a place, and something of its stories.', []],
      ['gor', 'Drive the Great Ocean Road', 'experience', 'Adventure', 'The Twelve Apostles and every lookout along the way.', []],
      ['camp', 'Learn to set up a campsite', 'knowledge', 'Life Admin', 'Tent, fire safety, water and leave-no-trace.', []],
      ['outback', 'Camp under outback stars', 'experience', 'Adventure', 'Somewhere far from any city lights.', ['camp']],
      ['overnight', 'Do an overnight hike', 'experience', 'Body', 'Carry everything you need for a night out.', ['camp']],
      ['overland', 'Walk the Overland Track', 'experience', 'Adventure', "Six days through Tasmania's wilderness.", ['overnight']],
      ['platypus', 'Spot a platypus in the wild', 'experience', 'Adventure', 'Patience at dawn or dusk by a quiet creek.', []]
    ]
  },
  {
    id: 'life-admin', name: 'Life Admin Adult', tree: 'Life Admin',
    blurb: 'Money, paperwork and home skills that make life calmer.',
    nodes: [
      ['taxes', 'Learn how taxes work', 'knowledge', 'Life Admin', 'Brackets, deductions and what actually happens at tax time.', []],
      ['super', 'Understand your super', 'knowledge', 'Life Admin', 'Fees, investment options and consolidating accounts.', ['taxes']],
      ['budget', 'Build a monthly budget', 'experience', 'Life Admin', 'Know where your money goes.', []],
      ['efund', 'Build an emergency fund', 'experience', 'Life Admin', 'Three months of essentials, set aside.', ['budget']],
      ['will', 'Write a will', 'experience', 'Life Admin', 'Future you, and your people, will thank you.', []],
      ['cooking', 'Cooking', 'skill', 'Life Admin', 'From survival meals to dinner for friends.', []],
      ['dinner', 'Host a dinner party', 'experience', 'Social', 'Cook a full meal for people you love.', ['cooking']],
      ['repairs', 'Home repairs', 'skill', 'Life Admin', 'Fix the tap, patch the wall, hang the shelf.', []],
      ['checkup', 'Get a full health check-up', 'experience', 'Body', 'Bloods, skin check, the works.', []]
    ]
  },
  {
    id: 'creative', name: 'Creative Hobbies', tree: 'Creative',
    blurb: 'Music, photography, drawing and writing, with real milestones.',
    nodes: [
      ['guitar', 'Guitar', 'skill', 'Creativity', 'Chords, strumming, songs.', []],
      ['song', 'Play a full song for someone', 'experience', 'Social', 'Start to finish, to an audience of at least one.', ['guitar']],
      ['openmic', 'Perform at an open mic', 'experience', 'Creativity', 'Nerves are part of it.', ['song']],
      ['camera', 'Learn manual camera settings', 'knowledge', 'Creativity', 'Aperture, shutter speed and ISO.', []],
      ['photo', 'Photography', 'skill', 'Creativity', 'Practise seeing light.', ['camera']],
      ['print', 'Print and frame your best photo', 'experience', 'Creativity', 'Make one shot physical.', ['photo']],
      ['drawing', 'Drawing', 'skill', 'Creativity', 'Sketch often, no pressure.', []],
      ['sketchbook', 'Fill a whole sketchbook', 'experience', 'Creativity', 'Every page, good and bad.', ['drawing']],
      ['story', 'Write a short story', 'experience', 'Creativity', 'Beginning, middle, end.', []],
      ['sharewriting', 'Share your writing with someone', 'experience', 'Social', 'Let someone read it.', ['story']]
    ]
  },
  {
    id: 'learn', name: 'Learn Something New', tree: 'Learning',
    blurb: 'A language, big ideas, money smarts and a little code.',
    nodes: [
      ['spanish', 'Spanish', 'skill', 'Mind', 'Vocabulary, listening, speaking.', []],
      ['convo', 'Hold a 10-minute conversation in Spanish', 'experience', 'Social', 'With a native speaker or a tutor.', ['spanish']],
      ['spanishtrip', 'Travel somewhere Spanish-speaking', 'experience', 'Adventure', 'Use it for real.', ['convo']],
      ['stoic', 'Read 5 books on stoicism', 'knowledge', 'Mind', 'Marcus Aurelius, Seneca, Epictetus and friends.', []],
      ['markets', 'Learn how the share market works', 'knowledge', 'Career', 'Shares, index funds and compounding.', []],
      ['coding', 'Coding', 'skill', 'Career', 'From first script to real projects.', []],
      ['ship', 'Build and ship a tiny app', 'experience', 'Career', 'Something real people can use.', ['coding']],
      ['course', 'Finish an online course', 'experience', 'Career', 'All the way to the end.', []],
      ['teach', 'Teach someone something you learned', 'experience', 'Social', 'The best test of understanding.', ['course']]
    ]
  },
  {
    id: 'fun', name: 'Fun Experiences', tree: 'Fun', isNew: true,
    blurb: 'Thrills, heights, live music and stories you will tell for years.',
    nodes: [
      ['themepark', 'Go to a theme park', 'experience', 'Adventure', 'A full day of rides, snacks and queues worth it.', []],
      ['coaster', 'Ride the biggest rollercoaster in the park', 'experience', 'Adventure', 'Front row if you dare.', ['themepark']],
      ['ropes', 'Conquer a high ropes course', 'experience', 'Adventure', 'Get comfortable being up high.', []],
      ['indoorsky', 'Try indoor skydiving', 'experience', 'Adventure', 'Learn what freefall feels like in a wind tunnel.', ['ropes']],
      ['skydive', 'Go skydiving', 'experience', 'Adventure', 'A tandem jump counts. Look down once you are out.', ['indoorsky']],
      ['bungee', 'Do a bungee jump', 'experience', 'Adventure', 'The final boss of heights.', ['skydive']],
      ['balloon', 'Ride a hot air balloon at sunrise', 'experience', 'Adventure', 'Quiet, slow and unforgettable.', ['ropes']],
      ['surf', 'Surfing', 'skill', 'Body', 'Paddling, popping up, reading waves.', []],
      ['greenwave', 'Ride an unbroken green wave', 'experience', 'Body', 'Past the whitewash and along the face.', ['surf']],
      ['snow', 'Skiing or snowboarding', 'skill', 'Body', 'From the beginner slope upwards.', []],
      ['blackrun', 'Ski or board a black run', 'experience', 'Adventure', 'Top to bottom, in one piece.', ['snow']],
      ['whaleshark', 'Swim with whale sharks', 'experience', 'Adventure', 'Ningaloo Reef, or anywhere they gather.', ['surf']],
      ['festival', 'Go to a music festival', 'experience', 'Social', 'Camp, dance, find a new favourite band.', ['concert']],
      ['concert', 'See your favourite artist live', 'experience', 'Social', 'Sing every word.', []],
      ['escape', 'Beat an escape room', 'experience', 'Social', 'With time on the clock.', []],
      ['gokart', 'Race go-karts with friends', 'experience', 'Social', 'Bragging rights included.', ['escape']],
      ['karaoke', 'Sing karaoke in front of strangers', 'experience', 'Social', 'Pick a song and commit.', []],
      ['comedy', 'Do a stand-up comedy open mic', 'experience', 'Creativity', 'Five minutes of your own material.', ['karaoke']]
    ]
  },
  {
    id: 'world', name: 'Travel the World', tree: 'World Travel', isNew: true,
    blurb: 'Passport stamps, great cities and once-in-a-lifetime places.',
    nodes: [
      ['passport', 'Get your passport sorted', 'experience', 'Life Admin', 'Valid for at least six months past your trip.', []],
      ['phrases', 'Learn 20 phrases in a local language', 'knowledge', 'Mind', 'Hello, thank you, sorry, where is…, how much…', []],
      ['travelhack', 'Travel planning', 'skill', 'Life Admin', 'Cheap flights, points, itineraries and packing light.', []],
      ['tokyo', 'Explore Tokyo', 'experience', 'Adventure', 'Neon, shrines, train stations and ramen.', ['passport']],
      ['paris', 'See Paris', 'experience', 'Adventure', 'Croissants, galleries and the city at night.', ['passport']],
      ['nyc', 'Walk across the Brooklyn Bridge in New York', 'experience', 'Adventure', 'Then get a slice.', ['passport']],
      ['rome', 'Eat your way through Rome', 'experience', 'Adventure', 'Carbonara, gelato, repeat.', ['paris']],
      ['cookabroad', 'Take a cooking class abroad', 'experience', 'Creativity', 'Bring a local dish home with you.', ['rome', 'phrases']],
      ['solo', 'Take a solo trip', 'experience', 'Adventure', 'Just you and wherever you end up.', ['passport']],
      ['eurorail', 'Backpack Europe by train', 'experience', 'Adventure', 'Five or more countries on one rail trip.', ['paris']],
      ['nz', 'Road trip New Zealand', 'experience', 'Adventure', 'Mountains, lakes and a campervan.', ['solo']],
      ['northernlights', 'See the Northern Lights', 'experience', 'Adventure', 'Norway, Iceland, Finland or Canada, on a clear dark night.', ['solo']],
      ['safari', 'Go on an African safari', 'experience', 'Adventure', 'Dawn game drives and big skies.', ['passport', 'travelhack']],
      ['machu', 'Hike to Machu Picchu', 'experience', 'Body', 'The Inca Trail, or the scenic way up.', ['solo']],
      ['traveljournal', 'Keep a journal for a whole trip', 'experience', 'Creativity', 'An entry every day, start to finish.', ['solo']],
      ['continents', 'Set foot on 5 continents', 'experience', 'Adventure', 'Asia, Europe, the Americas, Africa and home.', ['tokyo', 'paris', 'nyc', 'safari']]
    ]
  }
];
