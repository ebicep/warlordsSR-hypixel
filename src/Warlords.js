"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newWarlordsSr = exports.CLAZZES = exports.WARLORDS = void 0;
exports.WARLORDS = [
    {
        name: "mage",
        specs: [
            "pyromancer",
            "aquamancer",
            "cryomancer",
        ]
    },
    {
        name: "paladin",
        specs: [
            "avenger",
            "crusader",
            "protector"
        ]
    },
    {
        name: "shaman",
        specs: [
            "thunderlord",
            "spiritguard",
            "earthwarden"
        ]
    },
    {
        name: "warrior",
        specs: [
            "berserker",
            "defender",
            "revenant"
        ]
    }
];
exports.CLAZZES = exports.WARLORDS.map(value => value.name);
function newWarlordsSr() {
    return {
        SR: null,
        KD: null,
        KDA: null,
        WL: null,
        ACCURATE_WL: null,
        plays: null,
        DHP: null,
        realLosses: null,
        realPenalty: null,
        paladin: {
            DHP: null,
            SR: null,
            WL: null,
            LEVEL: null,
            WINS: null,
            avenger: { SR: null, DHP: null, WL: null, WINS: null },
            crusader: { SR: null, DHP: null, WL: null, WINS: null },
            protector: { SR: null, DHP: null, WL: null, WINS: null },
        },
        mage: {
            SR: null,
            WL: null,
            DHP: null,
            LEVEL: null,
            WINS: null,
            pyromancer: { SR: null, DHP: null, WL: null, WINS: null },
            aquamancer: { SR: null, DHP: null, WL: null, WINS: null },
            cryomancer: { SR: null, DHP: null, WL: null, WINS: null },
        },
        warrior: {
            DHP: null,
            SR: null,
            WL: null,
            LEVEL: null,
            WINS: null,
            berserker: { SR: null, DHP: null, WL: null, WINS: null },
            defender: { SR: null, DHP: null, WL: null, WINS: null },
            revenant: { SR: null, DHP: null, WL: null, WINS: null }
        },
        shaman: {
            DHP: null,
            SR: null,
            WL: null,
            LEVEL: null,
            WINS: null,
            thunderlord: { SR: null, DHP: null, WL: null, WINS: null },
            earthwarden: { SR: null, DHP: null, WL: null, WINS: null },
            spiritguard: { SR: null, DHP: null, WL: null, WINS: null }
        }
    };
}
exports.newWarlordsSr = newWarlordsSr;
//# sourceMappingURL=Warlords.js.map