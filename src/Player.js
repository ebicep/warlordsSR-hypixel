"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MANUAL_RELOAD_COOLDOWN_TIME = void 0;
const PlayerModel_1 = require("./db/PlayerModel");
const UUID_1 = require("hypixel-api-typescript/src/UUID");
const HypixelAPI = require("hypixel-api-typescript");
const Queue_1 = require("./utils/Queue");
const Exceptions_1 = require("hypixel-api-typescript/src/Exceptions");
const SrCalculator_1 = require("./SrCalculator");
const MinecraftApiCached = require("./utils/MinecraftApiRedisCached");
const app_1 = require("../app");
const UUID_2 = require("./utils/UUID");
const Ranking_1 = require("./Ranking");
const Statics_1 = require("./static/Statics");
if (!process.env.API_KEY)
    throw "Missing Hypixel API-KEY, please provide it with the environment variable 'API_KEY'!";
const API_KEY = UUID_1.default.fromString(process.env.API_KEY);
const q = new Queue_1.Queue();
const CACHE_TIME = 12 * 60 * 60;
exports.MANUAL_RELOAD_COOLDOWN_TIME = 15 * 60;
class Player {
    constructor(data, nameHistory) {
        this._data = data;
        this._uuid = UUID_2.stringToUuid(data.uuid.toString());
    }
    static init(uuid, isHighPriority = false, shouldReloadIfNotOnCooldown = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheResult = yield this.loadFromRedis(uuid);
            if (cacheResult) {
                if (!shouldReloadIfNotOnCooldown) {
                    console.info(`[WarlordsSR|PlayerCache] hit for ${uuid.toShortString()}`);
                    return cacheResult;
                }
                else {
                    const shouldReload = yield cacheResult.shouldReloadManually();
                    if (!shouldReload) {
                        console.info(`[WarlordsSR|PlayerCache] hit for ${uuid.toShortString()}`);
                        return cacheResult;
                    }
                }
            }
            const data = yield PlayerModel_1.PlayerModel.findOne({ uuid: uuid.toShortString() }).exec();
            let player;
            if (data && data.uuid == uuid.toShortString()) {
                player = new Player(data);
                yield player.reloadHypixelStats(isHighPriority);
            }
            else {
                const hypixelPlayer = yield Player.loadHypixelStats(uuid, isHighPriority);
                const warlordsStats = this.getWarlordsStatsFromHypixelStats(hypixelPlayer);
                let model = new PlayerModel_1.PlayerModel({
                    uuid: uuid.toShortString(),
                    name: hypixelPlayer.displayname,
                    warlords: warlordsStats
                });
                model = yield SrCalculator_1.calculateStatsAndSR(model);
                yield model.save();
                player = new Player(model);
            }
            yield player.getNameHistory();
            yield player.saveToRedis();
            return player;
        });
    }
    get uuid() {
        return this._uuid;
    }
    static loadFromRedis(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield app_1.redis.get(`wsr:${uuid.toString()}`);
            if (result) {
                const redisPlayer = JSON.parse(result);
                return new Player(redisPlayer.data, redisPlayer.nameHistory);
            }
            else {
                return undefined;
            }
        });
    }
    saveToRedis(overrideCacheTime) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_b = (_a = this.data) === null || _a === void 0 ? void 0 : _a.warlords_sr) === null || _b === void 0 ? void 0 : _b.SR) !== null && this.data.warlords_sr.SR > 0) {
                console.info(`SETTING RELOAD TIME FOR ${this.uuid.toShortString()}`);
                yield app_1.redis.set(`wsr:reloadcooldown:${this.uuid.toShortString()}`, Date.now().toString(), ["EX", exports.MANUAL_RELOAD_COOLDOWN_TIME]);
            }
            yield app_1.redis.set(`wsr:${this.uuid.toString()}`, JSON.stringify({
                data: this._data,
                nameHistory: this._nameHistory || null
            }), ["EX", overrideCacheTime ? overrideCacheTime : CACHE_TIME]);
        });
    }
    get data() {
        return this._data;
    }
    recalculateSr() {
        return __awaiter(this, void 0, void 0, function* () {
            this._data = yield SrCalculator_1.calculateStatsAndSR(this._data);
            yield this._data.save();
            return this._data;
        });
    }
    getNameHistoryString() {
        return __awaiter(this, void 0, void 0, function* () {
            const history = yield this.getNameHistory();
            if (!history || history.length === 0)
                return null;
            let result = "";
            for (let item of [...new Set(history.filter(v => v.name !== this._data.name).map(v => v.name))]) {
                result += item + " | ";
            }
            return result.substring(0, result.length - 3);
        });
    }
    get isInactive() {
        return !(this._data.lastLogin && this._data.lastTimeRecalculated)
            || this._data.lastLogin < Date.now() - Statics_1.INACTIVE_AFTER || this._data.lastTimeRecalculated < Date.now() - Statics_1.INACTIVE_AFTER;
    }
    getNameHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._nameHistory)
                return this._nameHistory;
            return MinecraftApiCached.nameHistoryForUuid(this.uuid);
        });
    }
    getRanking(checkForManualReload = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (checkForManualReload) {
                return Ranking_1.RankingCache.get(this.uuid, yield this.shouldReloadManually());
            }
            return Ranking_1.RankingCache.get(this.uuid);
        });
    }
    reloadHypixelStats(isHighPriority) {
        return __awaiter(this, void 0, void 0, function* () {
            const hypixelPlayer = yield Player.loadHypixelStats(this.uuid, isHighPriority);
            this._data.name = hypixelPlayer.displayname;
            this._data.lastLogin = hypixelPlayer.lastLogin || 0;
            this._data.warlords = Player.getWarlordsStatsFromHypixelStats(hypixelPlayer);
            return yield this.recalculateSr();
        });
    }
    static getWarlordsStatsFromHypixelStats(hypixelPlayer) {
        if (!hypixelPlayer || !hypixelPlayer.stats)
            throw Exceptions_1.default.NOT_FOUND;
        return hypixelPlayer.stats.Battleground;
    }
    getManualReloadCooldown() {
        return __awaiter(this, void 0, void 0, function* () {
            return app_1.redis.get(`wsr:reloadcooldown:${this.uuid.toShortString()}`);
        });
    }
    shouldReloadManually() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data.warlords_sr.SR == null || this.data.warlords_sr.SR <= 0)
                return false;
            const reloadCooldown = yield this.getManualReloadCooldown();
            return reloadCooldown == null;
        });
    }
    static loadHypixelStats(uuid, isHighPriority) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield q.add(() => __awaiter(this, void 0, void 0, function* () {
                return yield HypixelAPI.getPlayerByUuid(uuid, API_KEY);
            }), {
                priority: isHighPriority ? 1 : 0,
                heat: 1,
                queueTimeout: isHighPriority ? 20 * 1000 : 10 * 1000,
                executionTimeout: isHighPriority ? 15 * 1000 : 5 * 1000
            });
        });
    }
}
exports.default = Player;
;
//# sourceMappingURL=Player.js.map