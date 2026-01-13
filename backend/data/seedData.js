const buses = [
    {
        busNumber: 'AP-05-Z-1234',
        capacity: 40,
        type: 'Standard',
        amenities: ['AC', 'WiFi', 'CCTV'],
        driverName: 'Ramesh Reddy',
        attendantName: 'Suresh Babu',
        status: 'Active'
    },
    {
        busNumber: 'AP-05-Z-5678',
        capacity: 30,
        type: 'Mini-bus',
        amenities: ['CCTV'],
        driverName: 'Srinu Rao',
        attendantName: 'Venkatesh',
        status: 'Active'
    },
    {
        busNumber: 'AP-05-Z-9012',
        capacity: 50,
        type: 'Standard',
        amenities: ['AC', 'CCTV', 'GPS'],
        driverName: 'Appa Rao',
        attendantName: 'Nagesh',
        status: 'In Maintenance'
    }
];

const routes = [
    {
        routeId: 'R001',
        routeName: 'Kakinada City to Campus',
        startPoint: 'Jagannaickpur',
        endPoint: 'College Campus',
        totalDistance: 25,
        estimatedTime: '55 mins',
        stages: [
            {
                stageName: 'Jagannaickpur',
                distanceFromStart: 0,
                fare: 0
            },
            {
                stageName: 'Main Road (Balaji Cheruvu)',
                distanceFromStart: 5,
                fare: 10
            },
            {
                stageName: 'Bhanugudi Junction',
                distanceFromStart: 8,
                fare: 15
            },
            {
                stageName: 'Sarpavaram Junction',
                distanceFromStart: 12,
                fare: 20
            },
            {
                stageName: 'College Campus',
                distanceFromStart: 25,
                fare: 30
            }
        ]
    },
    {
        routeId: 'R002',
        routeName: 'Pithapuram to Campus',
        startPoint: 'Pithapuram Bus Stand',
        endPoint: 'College Campus',
        totalDistance: 32,
        estimatedTime: '1 hr 10 mins',
        stages: [
            {
                stageName: 'Pithapuram Bus Stand',
                distanceFromStart: 0,
                fare: 0
            },
            {
                stageName: 'Gollaprolu',
                distanceFromStart: 10,
                fare: 15
            },
            {
                stageName: 'Chebrolu',
                distanceFromStart: 18,
                fare: 25
            },
            {
                stageName: 'Samalkot Main Road',
                distanceFromStart: 22,
                fare: 30
            },
            {
                stageName: 'College Campus',
                distanceFromStart: 32,
                fare: 40
            }
        ]
    },
    {
        routeId: 'R003',
        routeName: 'Amalapuram to Campus',
        startPoint: 'Amalapuram Clock Tower',
        endPoint: 'College Campus',
        totalDistance: 65,
        estimatedTime: '1 hr 45 mins',
        stages: [
            {
                stageName: 'Amalapuram Clock Tower',
                distanceFromStart: 0,
                fare: 0
            },
            {
                stageName: 'Ambajipeta',
                distanceFromStart: 12,
                fare: 20
            },
            {
                stageName: 'Ravulapalem',
                distanceFromStart: 28,
                fare: 40
            },
            {
                stageName: 'Ramachandrapuram',
                distanceFromStart: 45,
                fare: 60
            },
            {
                stageName: 'College Campus',
                distanceFromStart: 65,
                fare: 80
            }
        ]
    }
];

module.exports = { buses, routes };
