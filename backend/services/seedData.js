const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round2 = (n) => Math.round(n * 100) / 100;

const MONTHS = 6;

function dateOffset({ monthsBack = 0, dayOffset = 0, hour, minute } = {}) {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsBack);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour ?? randInt(8, 22), minute ?? randInt(0, 59), 0, 0);
    return d;
}

function monthStart(monthsBack, day = 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsBack);
    d.setDate(day);
    d.setHours(randInt(6, 10), randInt(0, 59), 0, 0);
    return d;
}

function generateSeed(userId) {
    const txns = [];

    const push = (t) => txns.push({ userId, currency: 'EUR', type: 'expense', ...t });

    // Monthly salary (paid on the 25th)
    for (let i = MONTHS - 1; i >= 0; i--) {
        push({
            merchant: 'Cloudflight',
            amount: 2000,
            category: 'salary',
            type: 'income',
            date: monthStart(i, 25),
            description: 'Monthly salary',
        });
    }

    for (let i = MONTHS - 1; i >= 0; i--) {
        push({
            merchant: 'Netflix',
            amount: i === 0 ? 15.99 : 12.00,
            category: 'entertainment',
            date: monthStart(i, 3),
            description: 'Netflix Standard',
        });
    }

    for (let i = MONTHS - 1; i >= 0; i--) {
        push({
            merchant: '18 Gym',
            amount: 29.00,
            category: 'fitness',
            date: monthStart(i, 5),
            description: 'Gym monthly membership',
        });
    }

    for (let i = MONTHS - 1; i >= 0; i--) {
        push({
            merchant: 'Spotify',
            amount: 5,
            category: 'music',
            date: monthStart(i, 7),
            description: 'Spotify Premium',
        });
    }

    for (let i = MONTHS - 1; i >= 0; i--) {
        push({
            merchant: 'HBO Max',
            amount: 7.99,
            category: 'entertainment',
            date: monthStart(i, 14),
            description: 'HBO Max monthly',
        });
    }

    for (let i = MONTHS - 1; i >= 0; i--) {
        push({
            merchant: 'OpenAI',
            amount: 20.00,
            category: 'software',
            date: monthStart(i, 18),
            description: 'ChatGPT Plus',
        });
    }

    for (let i = MONTHS - 1; i >= 0; i--) {
        push({
            merchant: 'E.ON',
            amount: round2(rand(55, 95)),
            category: 'utilities',
            date: monthStart(i, 15),
            description: 'Electricity bill',
        });
        push({
            merchant: 'Digi',
            amount: 15.00,
            category: 'utilities',
            date: monthStart(i, 17),
            description: 'Internet + mobile',
        });
        push({
            merchant: 'Engie',
            amount: round2(rand(20, 30)),
            category: 'utilities',
            date: monthStart(i, 20),
            description: 'Gas bill',
        });
    }

    const grocers = ['Kaufland', 'Lidl', 'Carrefour', 'Mega Image', 'Profi', 'Auchan'];
    for (let i = MONTHS - 1; i >= 0; i--) {
        for (let w = 0; w < 8; w++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(randInt(1, 28));
            d.setHours(randInt(10, 20), randInt(0, 59), 0, 0);
            push({
                merchant: pick(grocers),
                amount: round2(rand(10, 50)),
                category: 'groceries',
                date: d,
                description: 'Groceries',
            });
        }
    }

    const cafes = ['Starbucks', '5 to go', 'Ted\'s Coffee', 'Origo'];
    for (let i = MONTHS - 1; i >= 0; i--) {
        const visits = randInt(5, 9);
        for (let v = 0; v < visits; v++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(randInt(1, 28));
            d.setHours(randInt(7, 17), randInt(0, 59), 0, 0);
            push({
                merchant: pick(cafes),
                amount: round2(rand(3.5, 5)),
                category: 'coffee',
                date: d,
                description: 'Coffee',
            });
        }
    }

    const delivery = ['Glovo', 'Tazz', 'Bolt Food'];
    for (let i = MONTHS - 1; i >= 0; i--) {
        const orders = randInt(3, 6);
        for (let o = 0; o < orders; o++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(randInt(1, 28));
            d.setHours(randInt(18, 22), randInt(0, 59), 0, 0);
            push({
                merchant: pick(delivery),
                amount: round2(rand(9, 20)),
                category: 'food',
                date: d,
                description: 'Food delivery',
            });
        }
    }

    const fuel = ['OMV', 'Petrom', 'Rompetrol', 'MOL'];
    for (let i = MONTHS - 1; i >= 0; i--) {
        const fills = randInt(2, 4);
        for (let f = 0; f < fills; f++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(randInt(1, 28));
            d.setHours(randInt(7, 20), randInt(0, 59), 0, 0);
            push({
                merchant: pick(fuel),
                amount: round2(rand(100, 150)),
                category: 'transport',
                date: d,
                description: 'Fuel',
            });
        }
        const rides = randInt(1, 3);
        for (let r = 0; r < rides; r++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(randInt(1, 28));
            d.setHours(randInt(8, 23), randInt(0, 59), 0, 0);
            push({
                merchant: pick(['Uber', 'Bolt']),
                amount: round2(rand(5, 10)),
                category: 'transport',
                date: d,
                description: 'Ride',
            });
        }
    }

    const restaurants = ['La Plăcinte', 'Caru\' cu Bere', 'Wu Xing', 'Shift Pub', 'Beraria H'];
    for (let i = MONTHS - 1; i >= 0; i--) {
        const visits = randInt(1, 3);
        for (let v = 0; v < visits; v++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(randInt(1, 28));
            d.setHours(randInt(18, 22), randInt(0, 59), 0, 0);
            push({
                merchant: pick(restaurants),
                amount: round2(rand(10, 50)),
                category: 'restaurants',
                date: d,
                description: 'Dinner',
            });
        }
    }

    const shops = [
        { merchant: 'eMAG', category: 'shopping', min: 10, max: 100 },
        { merchant: 'Zara', category: 'clothing', min: 20, max: 100 },
        { merchant: 'Decathlon', category: 'sports', min: 10, max: 120 },
        { merchant: 'IKEA', category: 'home', min: 60, max: 200 },
    ];
    for (let i = MONTHS - 1; i >= 0; i--) {
        const n = randInt(1, 3);
        for (let k = 0; k < n; k++) {
            const s = pick(shops);
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(randInt(1, 28));
            d.setHours(randInt(10, 21), randInt(0, 59), 0, 0);
            push({
                merchant: s.merchant,
                amount: round2(rand(s.min, s.max)),
                category: s.category,
                date: d,
                description: 'Online order',
            });
        }
    }

    return txns;
}

module.exports = { generateSeed };
