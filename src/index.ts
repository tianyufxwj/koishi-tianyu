import { Context, Schema, Session, h, Create, Tables } from 'koishi'
import fs from 'fs'
import path from 'path'
import seedrandom from 'seedrandom'
import random from 'random'
import zhCN from './locales/zh-CN';
console.log("✅ WWC插件开始加载，请确保locales文案文件语法正确、index.ts无语法错误");
export const name = 'xxck-1'
export const inject = ['database','canvas'] // 注入canvas服务
export interface PluginConfig {
  masterQQ: string
  signResetHour: number
  signResetMinute: number
  dailyExchangeLimit: number   // 新增
  exchangeVaporPerDraw: number   // 新增
  eventExchangePrice6: number   // 新增
  eventExchangePrice7: number   // 新增
  collectionPart1Pattern: string   // 收藏图1分类正则（匹配的类别归入WWC收藏1，默认：数字类别≥2000）
  collectionPart2Pattern: string   // 收藏图2分类正则（匹配的类别归入WWC收藏2，默认：数字类别<2000；不匹配1/2的归入WWC收藏3）
  disturbExchangePrice: number   // 扰动兑换：每抽扰动抽数消耗的热带扰动量（默认100）
  // 普通保底配置
  normalStar7Threshold: number   // 7星保底抽数
  normalStar6Threshold: number   // 6星保底抽数
  normalStar6Prob: number        // 6星保底概率（百分比，如95）
  // 限时保底配置
  eventStar6Threshold: number
  eventStar7Threshold: number
  // 抽卡星级概率配置（逗号分隔的数字序列，按星级从小到大）
  normalStarProbs: string      // 普通抽卡0~7星概率（百分比，支持小数），如 30,25,20,15,7.5,2,0.4,0.1
  eventPool6Weights: string    // 限时6星池0~7星权重（整数），如 3000,2500,2000,1500,700,150,140,10
  eventPool7Weights: string    // 限时7星池0~7星权重（整数），如 3000,2500,2000,1500,750,150,100,50
  disturbStarProbs: string     // 扰动抽卡5/6/7星权重（整数），如 54,36,10
  // 超级幸运配置
  superLuckyChance: number        // 每抽触发概率（百分比）
  superLuckyDisturbMin: number    // 额外扰动下限
  superLuckyDisturbMax: number    // 额外扰动上限
  superLuckyVaporMin: number      // 额外水汽下限
  superLuckyVaporMax: number      // 额外水汽上限
}

export const Config = Schema.object({
  masterQQ: Schema.string()
    .description('主人QQ号，拥有录入卡片、审核、开关功能等最高权限')
    .required(),
  signResetHour: Schema.number()
    .description('每日签到重置的小时数（0-23）')
    .default(0)
    .min(0)
    .max(23),
  signResetMinute: Schema.number()
    .description('每日签到重置的分钟数（0-59）')
    .default(0)
    .min(0)
    .max(59),
  dailyExchangeLimit: Schema.number()   // 新增
    .description('每日水汽兑换抽数上限（默认80）')
    .default(80)
    .min(1)
    .max(10000),
  exchangeVaporPerDraw: Schema.number()
  .description('普通兑换每抽消耗的水汽量（默认100）')
  .default(100)
  .min(0)
  .max(10000),
  eventExchangePrice6: Schema.number()
  .description('限时卡池6星兑换每抽消耗的水汽量（默认300）')
  .default(300)
  .min(1)
  .max(10000),
eventExchangePrice7: Schema.number()
  .description('限时卡池7星兑换每抽消耗的水汽量（默认450）')
  .default(450)
  .min(1)
  .max(10000),
  collectionPart1Pattern: Schema.string()
    .description('WWC收藏1的分类正则：类别名匹配此正则的归入收藏图1（默认匹配"纯数字且≥2000"）')
    .default('^([2-9]\\d{3}|\\d{5,})$')
    .role('textarea'),
  collectionPart2Pattern: Schema.string()
    .description('WWC收藏2的分类正则：类别名匹配此正则的归入收藏图2（默认匹配"纯数字且<2000"）；两个正则都不匹配的类别归入WWC收藏3')
    .default('^(\\d{1,3}|1\\d{3})$')
    .role('textarea'),
  disturbExchangePrice: Schema.number()
    .description('扰动兑换：每抽扰动抽数消耗的热带扰动量（默认100）')
    .default(100)
    .min(1)
    .max(100000),
  normalStar7Threshold: Schema.number()
    .description('普通卡池7星保底抽数（默认1500）')
    .default(1500)
    .min(1)
    .max(10000),
  normalStar6Threshold: Schema.number()
    .description('普通卡池6星保底抽数（默认300）')
    .default(300)
    .min(1)
    .max(10000),
  normalStar6Prob: Schema.number()
    .description('普通卡池6星保底抽出6星概率百分比（减去为抽出7星概率）')
    .default(90)
    .min(0)
    .max(100),
  eventStar6Threshold: Schema.number()
    .description('限时卡池6星保底抽数（默认200）')
    .default(200)
    .min(1)
    .max(10000),
  eventStar7Threshold: Schema.number()
    .description('限时卡池7星保底抽数（默认400）')
    .default(400)
    .min(1)
    .max(10000),
  superLuckyChance: Schema.number()
    .description('超级幸运：每抽触发概率（百分比，默认1）')
    .default(1)
    .min(0)
    .max(100),
  superLuckyDisturbMin: Schema.number()
    .description('超级幸运：额外热带扰动下限（默认0）')
    .default(0)
    .min(0)
    .max(100000),
  superLuckyDisturbMax: Schema.number()
    .description('超级幸运：额外热带扰动上限（默认20）')
    .default(20)
    .min(0)
    .max(100000),
  superLuckyVaporMin: Schema.number()
    .description('超级幸运：额外水汽下限（默认1000）')
    .default(1000)
    .min(0)
    .max(1000000),
  superLuckyVaporMax: Schema.number()
    .description('超级幸运：额外水汽上限（默认2000）')
    .default(2000)
    .min(0)
    .max(1000000),
  normalStarProbs: Schema.string()
    .description('普通抽卡各星级概率（%），按0~7星逗号分隔，支持小数。默认 30,25,20,15,7.5,2,0.4,0.1')
    .default('30,25,20,15,7.5,2,0.4,0.1')
    .role('textarea'),
  eventPool6Weights: Schema.string()
    .description('限时6星池各星级权重（相对比例），按0~7星逗号分隔。默认 3000,2500,2000,1500,700,150,140,10')
    .default('3000,2500,2000,1500,700,150,140,10')
    .role('textarea'),
  eventPool7Weights: Schema.string()
    .description('限时7星池各星级权重（相对比例），按0~7星逗号分隔。默认 3000,2500,2000,1500,750,150,100,50')
    .default('3000,2500,2000,1500,750,150,100,50')
    .role('textarea'),
  disturbStarProbs: Schema.string()
    .description('扰动抽卡各星级权重（相对比例），按5/6/7星逗号分隔。默认 54,36,10')
    .default('54,36,10')
    .role('textarea'),
}) satisfies Schema<PluginConfig>

declare module 'koishi' {
  interface Tables {
    gacha_user: {
      qq: string;
      nickname: string;
      status: number;
      protect: number;
    };
    gacha_user_exchange: {
      qq: string;
      create_at: number;
      count: number;
      [key: string]: any;
    };
    gacha_global_switch: {
      id: number;
      status: number;
    };
    gacha_group_switch: {
      group_id: string;
      status: number;
    };
    gacha_sign_config: {
      id: number;
      reset_hour: number;
      reset_minute: number;
    };
    gacha_card_pool: {
      card_id: string;
      card_name: string;
      card_star: number;
      category: string;
    };
    gacha_user_draw_count: {
      qq: string;
      draw_count: number;
      tropical_disturbance: number;
      water_vapor: number;
      no_6star_draws: number;
      no_7star_draws: number;
    };
    gacha_user_sign: {
      qq: string;
      last_sign_time: string;
    };
    gacha_user_card: {
      id: number;
      qq: string;
      card_id: string;
      card_level: number;
      obtain_at: number
    };
    gacha_shop_daily: {
      id: number;
      shop_date: string;
      card_id: string;
      card_star: number;
      price: number;
      server_bought: number;
      server_limit: number;
    };
    gacha_shop_exchange: {
      id: number;
      qq: string;
      exchange_date: string;
      exchange_count: number;
    };
    gacha_event_pool: {
      code: string
      card_id: string
      card_name: string
      card_star: number
      card_type: string
      start_at: number
      end_at: number
      created_at: number
    }
    // 用户限时抽数
    gacha_user_event_draw: {
      qq: string
      draw6: number
      draw7: number
      [key: string]: any
    }
    // 用户限时保底
    gacha_user_event_pity: {
      qq: string
      event_code: string
      pity6: number
      pity7: number
      got6: boolean
      got7: boolean
    }
    // 用户扰动抽数（WWC扰动抽卡专用）
    gacha_user_disturb_draw: {
      qq: string
      draw_count: number
    }
gacha_group_member: {
  group_id: string;
  qq: string;
  group_nickname: string;
  card: string;
};
user_platform_map: {
    platform: string;          // 如'onebot', 'qq_official'
    platform_user_id: string;  // 平台侧ID（QQ号或OpenID）
    qq: string;                // 统一QQ号
  };
  }

  interface Context {
    canvas: {
      createCanvas: (width: number, height: number) => Promise<{
        getContext: (type: '2d') => CanvasRenderingContext2D & {
          fillStyle: string;
          fillRect: (x: number, y: number, width: number, height: number) => void;
          font: string;
          fillText: (text: string, x: number, y: number) => void;
          measureText: (text: string) => { width: number };
        };
        toBuffer: (format: 'png') => Promise<Buffer>;
      }>;
    };
  }
}
// 全局工具函数
function get_star_symbol(star: number) {
  star = Math.max(0, Math.min(7, parseInt(star.toString())))
  return "★".repeat(star) + "☆".repeat(7 - star)
}
// ======================
// 通用手动自增ID生成器（修复 Koishi 不支持 autoIncrement）
// ======================
async function getNextId(ctx: Context, table: any) {
  const list = await ctx.database.get(table, {}, { fields: ['id'], sort: { id: 'desc' }, limit: 1 });
  return list.length ? (list[0].id as number) + 1 : 1;
}

// ======================
// 读取某日店铺行（按 card_id 去重合并）
// 背景：早期「WWC升格」回写全服限购时 upsert 未带主键 id，
// 导致同一张卡被反复插入新行 → 店铺图里出现重复卡片。
// 这里在读取侧做兼容合并：同一 card_id 只保留首次出现的行，
// server_bought 取组内最大值（不会把限购算多，避免误伤可购买次数）。
// ======================
async function getShopRowsByDate(ctx: Context, shopDate: string) {
  const rows = await ctx.database.get('gacha_shop_daily', { shop_date: shopDate });
  const merged = new Map<string, any>();
  for (const row of rows) {
    const key = String(row.card_id);
    const exist = merged.get(key);
    if (!exist) {
      merged.set(key, { ...row });
      continue;
    }
    if ((row.server_bought ?? 0) > (exist.server_bought ?? 0)) {
      exist.server_bought = row.server_bought ?? 0;
    }
  }
  return Array.from(merged.values());
}
export function unescapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  // 仅保留核心替换，避免多重转义冲突
  return str.replace(/&amp;/gi, '&');
}
export function splitAndPreserveNames(str: string): { name1: string; name2: string; hasAnd: boolean } {
  if (!str || typeof str !== 'string') {
    return { name1: '', name2: '', hasAnd: false };
  }
  // 先还原&转义字符，再拆分
  const pureStr = unescapeHtml(str);
  if (!pureStr.includes('&')) {
    return { name1: pureStr, name2: '', hasAnd: false };
  }
  // 拆分&两侧，去除多余空格
  const [name1, name2] = pureStr.split('&').map(n => n.trim());
  return {
    name1: name1 || '',
    name2: name2 || '',
    hasAnd: true
  };
}
// 🌟 全局常量：卡片等级上限（统一设为5，所有函数共用）
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
const CARD_LEVEL_MAX = 5;
// 🌟 0/1/2 星卡片满级后继续抽到：不再转化为热带扰动，改为发放对应水汽
// 只有普通抽卡与限时抽卡会抽到 0/1/2 星；店铺升格（只出5/6/7星）、扰动抽卡（只出5/6/7星）不涉及
const MAXED_STAR_TO_VAPOR: Record<number, number> = { 0: 10, 1: 25, 2: 40 };
// 🎲 解析逗号分隔的星级概率/权重配置（支持中英文逗号、空格分隔）
// 要求恰好 count 个非负数、不全为 0；非法时回退默认值并告警，保证抽卡永不中断
function parseStarConfig(ctx: Context, raw: string, count: number, fallback: number[], label: string): number[] {
  const arr = String(raw ?? '').split(/[,，\s]+/).filter(Boolean).map(Number);
  const valid = arr.length === count
    && arr.every(n => Number.isFinite(n) && n >= 0)
    && arr.some(n => n > 0);
  if (!valid) {
    ctx.logger.warn(`[${label}] 配置「${raw}」无效（需要${count}个非负数且不全为0），已回退默认值`);
    return fallback;
  }
  return arr;
}
// ⚡ 超级幸运：每抽有 superLuckyChance% 的概率额外获得扰动与水汽（区间随机，两端可取）
// 返回是否触发，并把额外奖励累加到传入的计数器上
function rollSuperLucky(
  cfg: {
    superLuckyChance: number,
    superLuckyDisturbMin: number,
    superLuckyDisturbMax: number,
    superLuckyVaporMin: number,
    superLuckyVaporMax: number
  },
  counter: { disturbance: number; vapor: number }
): boolean {
  if (cfg.superLuckyChance <= 0) return false;
  if (Math.random() * 100 >= cfg.superLuckyChance) return false;
  const dMin = Math.min(cfg.superLuckyDisturbMin, cfg.superLuckyDisturbMax);
  const dMax = Math.max(cfg.superLuckyDisturbMin, cfg.superLuckyDisturbMax);
  const vMin = Math.min(cfg.superLuckyVaporMin, cfg.superLuckyVaporMax);
  const vMax = Math.max(cfg.superLuckyVaporMin, cfg.superLuckyVaporMax);
  counter.disturbance += dMin + Math.floor(Math.random() * (dMax - dMin + 1));
  counter.vapor += vMin + Math.floor(Math.random() * (vMax - vMin + 1));
  return true;
}
// 抽卡结束后统一播报超级幸运。返回是否实际发送了消息（用于统计本条指令的发送条数）
async function sendSuperLucky(ctx: Context, session: Session, total: { disturbance: number; vapor: number }): Promise<boolean> {
  if (total.disturbance <= 0 && total.vapor <= 0) return false;
  ctx.logger.info(`超级幸运触发：扰动+${total.disturbance}，水汽+${total.vapor}`);
  await session.send(build_msg(session, session.text('tip.draw.superLucky', {
    disturbance: total.disturbance,
    vapor: total.vapor
  })));
  return true;
}
// QQ 单次交互（同一 msg_id 的被动回复）最多可发送 5 条消息，超出的会被平台拒绝。
// 高星播报原本每条卡片占 2 条（「风王出世」标题 + 卡片详情）
const QQ_MAX_SEND_PER_TURN = 5;
// 高星播报占用的消息条数（每条卡片 2 条：标题 + 卡片详情）
function highStarBroadcastCount(highStarCards: any[]): number {
  return highStarCards.length * 2;
}
/**
 * 决定高星播报的发送方式，保证「固定开销 + 播报条数」不超过 QQ 的上限。
 * - 'full'    逐卡播报（标题 + 卡片，每条 2 条），未超限时使用
 * - 'compact' 逐卡播报但省略标题（每条 1 条），省掉标题即可压进上限时使用
 * - 'merged'  所有高星合并成 1 条消息，紧凑模式仍然超限时使用（保底不丢结果）
 */
function planHighStarBroadcast(highStarCount: number, fixedCount: number): 'full' | 'compact' | 'merged' {
  if (highStarCount <= 0) return 'full';
  const fullTotal = fixedCount + highStarCount * 2;
  if (fullTotal <= QQ_MAX_SEND_PER_TURN) return 'full';
  if (fixedCount + highStarCount <= QQ_MAX_SEND_PER_TURN) return 'compact';
  return 'merged';
}
/**
 * 发送高星播报，按 planHighStarBroadcast 的策略自适应条数。
 * fixedCount 为本次抽卡除播报外已经/将要占用的消息条数（结算结果、超级幸运等）。
 * cards 需要提供 star / id / name 三个字段（两条抽卡路径的字段名不同，调用前统一）。
 */
async function sendHighStarBroadcast(
  ctx: Context,
  session: Session,
  showName: string,
  cards: { star: number; id: any; name: string }[],
  fixedCount: number
) {
  if (!cards.length) return;
  const plan = planHighStarBroadcast(cards.length, fixedCount);
  if (plan === 'merged') {
    ctx.logger.warn(`[高星播报] ${showName} 高星${cards.length}张，去掉标题仍超出${QQ_MAX_SEND_PER_TURN}条上限，已合并为单条播报`);
    const lines = cards.map(c => {
      const starText = get_star_symbol(c.star);
      return session.text('draw.broadcast.getCardCompact', { name: showName, star: starText, id: c.id, cardName: c.name });
    });
    await session.send(build_msg(session, lines.join('\n')));
    return;
  }
  const compact = plan === 'compact';
  if (compact) {
    ctx.logger.warn(`[高星播报] ${showName} 高星${cards.length}张，已省略「风王出世」标题以避免超出条数上限`);
  }
  for (const c of cards) {
    const starText = get_star_symbol(c.star);
    if (compact) {
      await session.send(build_msg(session,
        session.text('draw.broadcast.getCardCompact', { name: showName, star: starText, id: c.id, cardName: c.name })
      ));
    } else {
      await session.send(build_msg(session, session.text('draw.broadcast.title')));
      await new Promise(r => setTimeout(r, 3000));
      await session.send(build_msg(session,
        session.text('draw.broadcast.getCard', { name: showName, star: starText, id: c.id, cardName: c.name })
      ));
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}
function build_msg(session:Session,content: string) {
  // 统一返回纯文本，**群聊/私聊都不带@**
  return h.text(content);
}
function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
// 全局工具函数 - 字体加载修复
function getFontFamily() {
  // 适配不同系统的中文字体，优先使用系统自带中文字体
  return 'Microsoft YaHei, SimHei, "黑体", "宋体", sans-serif';
}
async function _warehouse_draw_image(
  ctx: Context,
  user_cards: any[],
  show_name: string,
  titleText: string, // 传入渲染后的标题
  emptyText: string  // 传入渲染后的空提示
) {
  try {
    ctx.logger.info("开始绘制 WWC 仓库图片（限定卡独立显示）");
    const STAR_COLOR = {
      7: "#FF00FF",
      6: "#C00000",
      5: "#FF0000",
      4: "#ED7D31",
      3: "#F7B309",
      2: "#C4D44C",
      1: "#56CA85",
      0: "#33CAFD"
    } as const;
    const COL_MAX = 60;
    const COLUMN_WIDTH = 330;
    const COLUMN_GAP = 20;
    const ROW_HEIGHT = 26;
    const PADDING = 20;
    const TITLE_HEIGHT = 50;
    const [normalCards, eventCards] = await Promise.all([
      ctx.database.get("gacha_card_pool", {}),
      ctx.database.get("gacha_event_pool", {})
    ]);
    const cardPool = new Map();
    normalCards.forEach(c => cardPool.set(c.card_id, {
      name: c.card_name,
      star: c.card_star,
      isLimit: false
    }));
    eventCards.forEach(c => {
      if (!cardPool.has(c.card_id)) {
        cardPool.set(c.card_id, {
          name: c.card_name,
          star: c.card_star,
          isLimit: true
        });
      }
    });
    const cardMap = new Map();
    for (const item of user_cards || []) {
      const card_id = item.card_id;
      const currentLevel = item.card_level ?? 0;
      if (!cardMap.has(card_id)) {
        cardMap.set(card_id, item);
      } else {
        const existing = cardMap.get(card_id);
        if (currentLevel > (existing.card_level ?? 0)) {
          cardMap.set(card_id, item);
        }
      }
    }
    const uniqueCards = Array.from(cardMap.values());
    const validCards = uniqueCards.map(item => {
      const pool = cardPool.get(item.card_id) || {};
      return {
        id: item.card_id,
        name: pool.name || "未知",
        level: item.card_level ?? 0,
        star: pool.star || 0,
        isLimit: pool.isLimit || false
      };
    });
    const sortedCards = [...validCards].sort((a, b) => {
      if (a.isLimit !== b.isLimit) return b.isLimit ? 1 : -1;
      if (b.star !== a.star) return b.star - a.star;
      return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
    });
    const total = sortedCards.length;
    const colCount = Math.ceil(total / COL_MAX);
    const showRows = Math.min(COL_MAX, total || 1);
    const canvasWidth = PADDING + colCount * (COLUMN_WIDTH + COLUMN_GAP) + PADDING;
    const canvasHeight = TITLE_HEIGHT + showRows * ROW_HEIGHT + PADDING * 2;
    const canvas = await ctx.canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return null;
    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx2d.textBaseline = "top";
    ctx2d.textAlign = "left";
    ctx2d.font = `20px ${getFontFamily()}`;
    ctx2d.fillStyle = "#000";
    ctx2d.fillText(titleText, PADDING, PADDING); // 使用传入的渲染后标题
    const getStarText = (star: number) => {
      const s = Math.max(0, Math.min(7, star));
      return "★".repeat(s) + "☆".repeat(7 - s);
    };
    sortedCards.forEach((card, index) => {
      const { level, id, name, star, isLimit } = card;
      const col = Math.floor(index / COL_MAX);
      const row = index % COL_MAX;
      const x = PADDING + col * (COLUMN_WIDTH + COLUMN_GAP);
      const y = TITLE_HEIGHT + row * ROW_HEIGHT;
      const limitTag = isLimit ? "【限定】" : "";
      const text = `[${level}] ${id.padStart(4, '0')} ${name} ${limitTag}${getStarText(star)}`;
      ctx2d.font = `16px ${getFontFamily()}`;
      ctx2d.fillStyle = STAR_COLOR[star as keyof typeof STAR_COLOR] || "#333";
      ctx2d.fillText(text, x, y);
    });
    if (total === 0) {
      ctx2d.fillText(emptyText, PADDING, TITLE_HEIGHT); // 使用传入的渲染后空提示
    }
    const buffer = await canvas.toBuffer("image/png"as any);
    return h.image(buffer, "image/png");
  } catch (err) {
    ctx.logger.error("仓库绘图失败：", err);
    return null;
  }
}
/**
 * 店铺图片绘制函数（本地化修复版）
 * 严格匹配文案文件键名，无硬编码，参数传递一致，样式适配
 */
async function _shop_draw_image(
  ctx: Context,
  session: Session,
  userName: string,
  date: string,
  disturbance: number,
  vapor: number,
  drawLeft: number,
  usedExchange: number,
  limitExchange: number,
  shopCards: any[]
) {
  ctx.logger.info("开始绘制店铺图片（最终稳定版）");
  try {
    if (!ctx.canvas) return null;

    const BASE_X = 40;
    const BASE_Y = 30;
    const CANVAS_WIDTH = 900;
    const CARD_ITEM_HEIGHT = 85;
    // 首行卡片基线 = headerY(BASE_Y+200) + 35
    const FIRST_CARD_Y = BASE_Y + 235;
    // 画布高度按卡片数量自适应：10张时仍为原来的1100，卡片更多时自动加高，避免末尾卡片被裁掉
    const CANVAS_HEIGHT = Math.max(
      1100,
      FIRST_CARD_Y + Math.max(0, (shopCards?.length ?? 0) - 1) * CARD_ITEM_HEIGHT + 70
    );
    const FONT_FAMILY = 'Microsoft YaHei, SimHei, 黑体, 宋体, sans-serif';

    const canvas = await ctx.canvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return null;

    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx2d.textBaseline = "alphabetic";
    ctx2d.textAlign = "left";

    const distStr = String(disturbance ?? 0);
    const vaporStr = String(vapor ?? 0);
    const drawStr = String(drawLeft ?? 0);

    // 标题
    ctx2d.save();
    ctx2d.textAlign = "center";
    ctx2d.fillStyle = "#E53E3E";
    ctx2d.font = `bold 30px ${FONT_FAMILY}`;
    ctx2d.fillText(`WWC每日店铺 ${date}`, CANVAS_WIDTH / 2, BASE_Y + 30);
    ctx2d.restore();

    // 玩家信息
    ctx2d.fillStyle = "#222";
    ctx2d.font = `20px ${FONT_FAMILY}`;
    ctx2d.fillText(`玩家：${userName}`, BASE_X, BASE_Y + 80);
    ctx2d.fillText(`热带扰动：${distStr}｜水汽：${vaporStr}｜剩余抽数：${drawStr}`, BASE_X, BASE_Y + 120);

    // 表头
    const headerY = BASE_Y + 200;
    ctx2d.save();
    ctx2d.fillStyle = "#000";
    ctx2d.font = `bold 18px ${FONT_FAMILY}`;
    ctx2d.fillText("卡片", BASE_X, headerY);
    ctx2d.textAlign = "center";
    ctx2d.fillText("价格", CANVAS_WIDTH / 2, headerY);
    ctx2d.textAlign = "right";
    ctx2d.fillText("兑换指令", CANVAS_WIDTH - BASE_X, headerY);
    ctx2d.restore();

    ctx2d.beginPath();
    ctx2d.moveTo(BASE_X, headerY + 5);
    ctx2d.lineTo(CANVAS_WIDTH - BASE_X, headerY + 5);
    ctx2d.strokeStyle = "#e5e5e5";
    ctx2d.lineWidth = 2;
    ctx2d.stroke();

    let cardY = headerY + 35;
    shopCards.forEach((card, index) => {
      const cid = card.id || "未知";
      const cname = card.name || "未知卡片";
      const star = card.star || 0;
      const starSymbol = "★".repeat(star) + "☆".repeat(7 - star);
      const leftLimit = String(card.leftLimit ?? 0);
      const price = String(card.price ?? 0);

      ctx2d.save();
      ctx2d.fillStyle = "#333";
      ctx2d.font = `16px ${FONT_FAMILY}`;
      ctx2d.textAlign = "left";
      ctx2d.fillText(`${starSymbol} 【${cid}】${cname}（剩余：${leftLimit}张）`, BASE_X, cardY);

      ctx2d.fillStyle = "#FF0000";
      ctx2d.font = `bold 16px ${FONT_FAMILY}`;
      ctx2d.textAlign = "center";
      ctx2d.fillText(price, CANVAS_WIDTH / 2, cardY);

      ctx2d.fillStyle = "#1890FF";
      ctx2d.font = `16px ${FONT_FAMILY}`;
      ctx2d.textAlign = "right";
      ctx2d.fillText(`WWC升格 ${cid}`, CANVAS_WIDTH - BASE_X, cardY);
      ctx2d.restore();

      cardY += CARD_ITEM_HEIGHT;
      if (index < shopCards.length - 1) {
        ctx2d.beginPath();
        ctx2d.moveTo(BASE_X, cardY - 15);
        ctx2d.lineTo(CANVAS_WIDTH - BASE_X, cardY - 15);
        ctx2d.strokeStyle = "#f5f5f5";
        ctx2d.lineWidth = 1;
        ctx2d.stroke();
      }
    });

    ctx2d.save();
    ctx2d.fillStyle = "#666";
    ctx2d.font = `14px ${FONT_FAMILY}`;
    ctx2d.textAlign = "center";
    ctx2d.fillText("每日限购刷新时间与签到时间一致", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    ctx2d.restore();

    const buffer = await canvas.toBuffer("image/png" as any);
    ctx.logger.info("店铺图片生成成功 ✅");
    return h.image(buffer, "image/png");
  } catch (err) {
    ctx.logger.error("店铺绘图失败：", err);
    return null;
  }
}
async function getUnifiedQQ(ctx: Context, session: Session): Promise<string> {
  const userId = session.userId;
  if (/^\d+$/.test(userId)) return userId; // OneBot 直接返回
  const records = await ctx.database.get('user_platform_map', {
    platform_user_id: userId
  });
  if (records.length) return records[0].qq;
  // 未绑定，仍返回原始 ID（但后续可引导绑定）
  ctx.logger.warn(`用户 ${userId} 未绑定QQ号，将使用原始ID`);
  return userId;
}
// 新增：接收渲染后的文案参数
// 收藏图鉴绘图函数 - 终极修复版（类别+进度正常显示）
// 收藏图鉴绘图函数 - 加宽加高卡片+18px字体+双台卡支持
// 收藏图鉴绘图函数 - 标题防干扰修复版
async function _collection_draw_image(
  ctx: Context,
  session: Session,
  titleText: string,
  totalText: string,
  emptyText: string,
  categories: string[],
  categoryGroup: any,
  totalCollected: number
) {
  ctx.logger.info("开始绘制收藏图片（彻底隔离标题影响终极版）");
  try {
    if (!ctx.canvas) return null;
    // 绘图核心配置：绝对独立的分类渲染参数，与标题完全解耦
    const ABSOLUTE_X = 100; // 所有分类统一X轴基准（硬编码，无动态关联）
    const BASE_Y = 20;
    const CARD_WIDTH = 150;
    const CARD_HEIGHT = 100;
    const CARD_GAP = 20;
    const ROW_MAX = 5;
    const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP;
    const CATE_TITLE_HEIGHT = 40; // 固定标题行高
    const CATE_PROGRESS_HEIGHT = 30; // 固定进度行高
    const TITLE_BOTTOM_Y = 90; // 大标题底部固定Y值
    const CATE_TOP_MARGIN = 80; // 放大间距，彻底隔离标题
    const CATE_SPACING = 70; // 分类之间固定间距

    // 星级染色/字体函数（统一配置）
    const STAR_COLOR = {
      7: "#FF00FF", 6: "#C00000", 5: "#FF0000", 4: "#ED7D31",
      3: "#F7B309", 2: "#C4D44C", 1: "#56CA85", 0: "#33CAFD"
    };
    const getFontFamily = () => 'Microsoft YaHei, SimHei, 黑体, 宋体, sans-serif';

    // 画布高度计算（冗余空间，避免挤压）
    let canvasHeight = TITLE_BOTTOM_Y + CATE_TOP_MARGIN + BASE_Y * 5;
    categories.forEach(cate => {
      const cardCount = categoryGroup[cate].length;
      const rowCount = Math.ceil(cardCount / ROW_MAX);
      canvasHeight += CATE_TITLE_HEIGHT + CATE_PROGRESS_HEIGHT + (rowCount * ROW_HEIGHT) + CATE_SPACING;
    });
    canvasHeight = Math.max(canvasHeight, 1500); // 最低高度1500px，杜绝拥挤
    const canvasWidth = 980;

    // 创建画布+初始化（重置所有绘图状态）
    const canvas = await ctx.canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return null;
    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillRect(0, 0, canvasWidth, canvasHeight);
    // 🔥 关键修复1：初始化时统一设置基础绘图状态，与后续标题绘制隔离
    ctx2d.textBaseline = "bottom";
    ctx2d.textAlign = "left";
    ctx2d.font = `16px ${getFontFamily()}`;

    // 绘制顶部大标题+总进度（独立作用域，绘制后强制重置状态）
    (() => {
      // 局部作用域内修改状态，不影响外部
      ctx2d.save(); // 保存当前绘图状态（左对齐+bottom基线）
      ctx2d.textAlign = "center"; // 仅在该作用域内生效
      ctx2d.font = `bold 28px ${getFontFamily()}`;
      ctx2d.fillStyle = "#000";
      ctx2d.fillText(titleText, canvasWidth / 2, 55);
      ctx2d.font = `bold 22px ${getFontFamily()}`;
      ctx2d.fillStyle = "#E53E3E";
      ctx2d.fillText(totalText, canvasWidth / 2, TITLE_BOTTOM_Y);
      ctx2d.restore(); // 🔥 强制恢复初始状态（左对齐+bottom基线）
    })();

    // 无卡片时的空提示
    if (totalCollected === 0) {
      ctx2d.save();
      ctx2d.textAlign = "center";
      ctx2d.fillStyle = "#666";
      ctx2d.font = `20px ${getFontFamily()}`;
      ctx2d.fillText(emptyText, canvasWidth / 2, 200);
      ctx2d.restore(); // 恢复状态
      const buffer = await canvas.toBuffer("image/png" as any);
      return h.image(buffer, "image/png");
    }

    // 🔥 关键修复2：分类渲染起始位置与标题彻底隔离
    let drawY = TITLE_BOTTOM_Y + CATE_TOP_MARGIN;

    // 遍历分类：第一个分类与后续分类逻辑完全一致，无任何差异化
    categories.forEach((cate, index) => {
      const cardList = categoryGroup[cate] || [];
      const collectedNum = cardList.filter(c => c.isCollected).length;
      const totalNum = cardList.length;
      const cateRate = totalNum > 0 ? ((collectedNum / totalNum) * 100).toFixed(1) : "0.0";

      // 1. 分类标题：强制左对齐，X轴绝对固定
      ctx2d.save(); // 再次保存状态，防止意外污染
      ctx2d.textAlign = "left"; // 明确指定左对齐，不受任何外部影响
      ctx2d.font = `bold 22px ${getFontFamily()}`;
      ctx2d.fillStyle = "#222";
      const cateTitle = session.text("image.collection.cateTitleFormat", { cate });
      // X轴硬编码，Y轴固定偏移，无任何动态计算
      ctx2d.fillText(cateTitle, ABSOLUTE_X, drawY);
      ctx2d.restore(); // 恢复状态
      drawY += CATE_TITLE_HEIGHT;

      // 2. 分类进度：与标题完全对齐
      ctx2d.save();
      ctx2d.textAlign = "left";
      ctx2d.font = `20px ${getFontFamily()}`;
      ctx2d.fillStyle = "#E53E3E";
      const progressText = session.text("image.collection.cateProgress", {
        collected: collectedNum,
        total: totalNum,
        rate: cateRate
      });
      ctx2d.fillText(progressText, ABSOLUTE_X+20, drawY);
      ctx2d.restore();
      drawY += CATE_PROGRESS_HEIGHT;

      // 卡片与进度的固定间距
      drawY += 8;

      // 3. 卡片绘制：X轴与标题统一
      let cardX = ABSOLUTE_X;
      cardList.forEach((card, i) => {
        if (i > 0 && i % ROW_MAX === 0) {
          cardX = ABSOLUTE_X;
          drawY += ROW_HEIGHT;
        }

        // 卡片边框/内容绘制（统一规则）
        ctx2d.fillStyle = "#fff";
        ctx2d.strokeStyle = card.isLimit ? "#FF0000" : "#e5e5e5";
        ctx2d.lineWidth = card.isLimit ? 2 : 1;
        ctx2d.fillRect(cardX, drawY, CARD_WIDTH, CARD_HEIGHT);
        ctx2d.strokeRect(cardX, drawY, CARD_WIDTH, CARD_HEIGHT);

        const cardCenterX = cardX + CARD_WIDTH / 2;
        const cardCenterY = drawY + CARD_HEIGHT / 2;
        ctx2d.save();
        ctx2d.textAlign = "center"; // 仅卡片内部文字居中
        if (card.isCollected) {
          ctx2d.fillStyle = STAR_COLOR[card.star] || "#333";
          ctx2d.font = `bold 20px ${getFontFamily()}`;
          const cardName = card.name || "未知";
          if (cardName.includes("&")) {
            const [name1, name2] = cardName.split("&").map(n => n.trim());
            ctx2d.fillText(name1 || "", cardCenterX, cardCenterY - 20);
            ctx2d.fillText("&", cardCenterX, cardCenterY + 5);
            ctx2d.fillText(name2 || "", cardCenterX, cardCenterY + 30);
          } else {
            const showName = cardName.length > 8 ? cardName.slice(0, 8) : cardName;
            ctx2d.fillText(showName, cardCenterX, cardCenterY + 8);
          }
        } else {
          ctx2d.fillStyle = "#999999";
          ctx2d.font = `bold 28px ${getFontFamily()}`;
          ctx2d.fillText("？", cardCenterX, cardCenterY + 8);
        }
        ctx2d.restore(); // 恢复左对齐状态
        cardX += CARD_WIDTH + CARD_GAP;
      });

      // 分类之间固定间距
      drawY += (cardList.length > 0 ? CARD_HEIGHT : 0) + CATE_SPACING;
    });

    const buffer = await canvas.toBuffer("image/png" as any);
    ctx.logger.info("收藏图片生成成功（彻底隔离标题影响）✅");
    return h.image(buffer, "image/png");
  } catch (err) {
    ctx.logger.error("收藏绘图失败：", err);
    return null;
  }
}

// 完整修复后的 _ranking_draw_image 函数
// 新增：接收渲染后的文案参数
async function _ranking_draw_image(
  ctx: Context,
  ranking_list: any[],
  user_rank: number,
  user_collected: number,
  show_name: string,
  titleText: string, // 渲染后的标题
  headerRankText: string, // 渲染后的表头-排名
  headerPlayerText: string, // 渲染后的表头-玩家
  headerCountText: string, // 渲染后的表头-数量
  mineText: string // 渲染后的我的排名
) {
  try {
    const img_width = 600;
    const line_height = 32;
    const header = 130;
    const total_height = header + (Math.min(ranking_list.length, 20) * line_height) + 60;
    if (!ctx.canvas) return null;
    const canvas = await ctx.canvas.createCanvas(img_width, total_height);
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return null;
    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillRect(0, 0, img_width, total_height);
    ctx2d.textAlign = "center";
    ctx2d.font = `bold 32px ${getFontFamily()}`;
    ctx2d.fillStyle = "#2a2a2a";
    ctx2d.fillText(titleText, img_width / 2, 50); // 使用渲染后标题
    ctx2d.textAlign = "left";
    ctx2d.font = `18px ${getFontFamily()}`;
    ctx2d.fillStyle = "#666666";
    ctx2d.fillText(headerRankText, 60, 95); // 使用渲染后表头
    ctx2d.fillText(headerPlayerText, 200, 95);
    ctx2d.fillText(headerCountText, 460, 95);
    const showList = ranking_list.slice(0, 20);
    showList.forEach((item, i) => {
      const rank = item[0] ?? "-";
      const name = item[1] ?? "未知";
      const cnt = item[2] ?? 0;
      const y = 130 + i * line_height;
      if (rank === 1) {
        ctx2d.fillStyle = "#ffd700";
      } else if (rank === 2) {
        ctx2d.fillStyle = "#c0c0c0";
      } else if (rank === 3) {
        ctx2d.fillStyle = "#cd7f32";
      } else {
        ctx2d.fillStyle = name === show_name ? "#ff4444" : "#333333";
      }
      ctx2d.font = `16px ${getFontFamily()}`;
      ctx2d.fillText(`${rank}`, 60, y);
      ctx2d.fillText(`${name}`, 200, y);
      ctx2d.fillText(`${cnt}`, 460, y);
    });
    ctx2d.textAlign = "center";
    ctx2d.font = `16px ${getFontFamily()}`;
    ctx2d.fillStyle = "#666666";
    ctx2d.fillText(mineText, img_width / 2, total_height - 30); // 使用渲染后我的排名
    const buffer = await canvas.toBuffer("image/png"as any);
    return h.image(buffer, "image/png");
  } catch (err) {
    ctx.logger.error("排行绘图失败", err);
    return null;
  }
}

// 核心业务函数
async function _do_register(ctx: Context, session: Session, nickname: string, masterQQ: string) {
  const qq = await getUnifiedQQ(ctx, session);
  const exist = await ctx.database.get('gacha_user', { qq })
  if (!exist.length) {
    await ctx.database.create('gacha_user', { qq, nickname, status: 0, protect: 0 })
    // 修复：正确调用 session.text
    await session.send(build_msg(session, session.text('tip.register.success')))
  } else {
    await ctx.database.upsert('gacha_user', [{ qq, nickname, status: 0, protect: exist[0].protect }])
    await session.send(build_msg(session, session.text('tip.register.modify')))
  }
  let targetId = masterQQ; // 默认使用 QQ 号
if (session.platform !== 'onebot') {
  // 从映射表查该平台下主人的 OpenID
  const record = await ctx.database.get('user_platform_map', {
    qq: masterQQ,
    platform: session.platform
  });
  if (record.length) {
    targetId = record[0].platform_user_id;
  } else {
    // 未映射则无法发送，可记录日志或改发群消息提醒
    ctx.logger.warn(`主人 ${masterQQ} 在当前平台 ${session.platform} 未绑定，无法发送私聊通知`);
    return; // 或尝试其他方式
  }
}
  // 修复：传递参数 qq 和 nickname
  await session.bot.sendPrivateMessage(targetId, session.text('sys.notify.register', { qq, nickname }))
}

async function _do_check(
  ctx: Context,
  session: Session,
  check_qq: string | undefined,
  masterQQ: string,
  all: boolean
) {
  // 权限检查（使用 unifiedQQ）
  const userId = session.userId;
  const isNumeric = /^\d+$/.test(userId);
  let userQQ = userId;
  if (!isNumeric) {
    const records = await ctx.database.get('user_platform_map', {
      platform_user_id: userId
    });
    if (records.length) userQQ = records[0].qq;
  }
  if (userQQ !== masterQQ) {
    return await session.send(build_msg(session, session.text('error.common.noPermission')));
  }

  if (all) {
    // 批量通过所有待审核用户
    const pendingUsers = await ctx.database.get('gacha_user', { status: 0 });
    if (pendingUsers.length === 0) {
      return await session.send(build_msg(session, '当前没有待审核的用户。'));
    }

    // 批量更新 status = 1
    for (const user of pendingUsers) {
      await ctx.database.upsert('gacha_user', [{
        qq: user.qq,
        status: 1,
        protect: user.protect,
        // nickname 保持不变
      }]);
    }

    // 发送通过名单（可选）
    const nameList = pendingUsers.map(u => `${u.qq}（${u.nickname}）`).join('\n');
    await session.send(build_msg(session, `✅ 已通过 ${pendingUsers.length} 位用户的审核：\n${nameList}`));
    return;
  }

  // 原有单用户审核逻辑
  if (!check_qq) {
    return await session.send(build_msg(session, '请指定要审核的QQ号，或使用 -a 全部通过'));
  }
  const exist = await ctx.database.get('gacha_user', { qq: check_qq });
  if (!exist.length) {
    return await session.send(build_msg(session, session.text('error.common.notRegister')));
  }
  if (exist[0].status === 1) {
    return await session.send(build_msg(session, `用户 ${check_qq} 已审核通过，无需重复操作。`));
  }
  await ctx.database.upsert('gacha_user', [{ qq: check_qq, status: 1, protect: exist[0].protect }]);
  await session.send(build_msg(session, session.text('tip.check.success')));
}

async function _do_sign(
  ctx: Context,
  session: Session,
  signResetHour?: number,
  signResetMinute?: number
) {
  const qq = await getUnifiedQQ(ctx, session);
  const user = await ctx.database.get('gacha_user', { qq });
  if (!user.length) {
    await session.send(build_msg(session, session.text('error.common.notRegister')));
    return;
  }

  const now = new Date();
  let resetHour = signResetHour ?? 0;
  let resetMinute = signResetMinute ?? 0;
  let todayDate = new Date(now);
  todayDate.setHours(resetHour, resetMinute, 0, 0);
  if (now < todayDate) {
    todayDate.setDate(todayDate.getDate() - 1);
  }
  const today = todayDate.getFullYear() + 
                String(todayDate.getMonth() + 1).padStart(2, '0') + 
                String(todayDate.getDate()).padStart(2, '0');
  const nowFullTime = today + 
                      String(now.getHours()).padStart(2, '0') + 
                      String(now.getMinutes()).padStart(2, '0') + 
                      String(now.getSeconds()).padStart(2, '0');

  const signRecords = await ctx.database.get('gacha_user_sign', { qq });
  if (signRecords.length > 0) {
    const last = signRecords[0].last_sign_time;
    if (last.slice(0, 8) === today) {
      await session.send(build_msg(session, session.text('error.sign.hasSigned')));
      return;
    }
  }

  const SIGN_DRAW_COUNT = 40; 
  const userAsset = await ctx.database.get('gacha_user_draw_count', { qq });
  const newDrawCount = (userAsset[0]?.draw_count ?? 0) + SIGN_DRAW_COUNT;

  // 每日限购重置说明：
  // 限购记录按日期存在 gacha_shop_daily（每张卡一行，server_limit=5，server_bought 当日累加），
  // 每天首次执行 WWC店铺 时会以新日期生成一批 server_bought=0 的记录，
  // 日期与签到共用同一套 resetHour/resetMinute，因此限购天然随日期自动重置，签到无需额外处理。

  await ctx.database.upsert('gacha_user_draw_count', [{
    qq,
    draw_count: newDrawCount,
    tropical_disturbance: userAsset[0]?.tropical_disturbance ?? 0,
    water_vapor: userAsset[0]?.water_vapor ?? 0,
    no_6star_draws: userAsset[0]?.no_6star_draws ?? 0,
    no_7star_draws: userAsset[0]?.no_7star_draws ?? 0,
  }]);

  await ctx.database.upsert('gacha_user_sign', [{
    qq: qq,
    last_sign_time: nowFullTime
  }]);

  // 修复：传递参数 count 和 left
  await session.send(build_msg(session, 
    `${session.text('tip.sign.success')}\n${session.text('tip.sign.getDraw', { count: SIGN_DRAW_COUNT, left: newDrawCount })}`
  ));
}

async function _do_add_card(ctx: Context, session: Session, card_lines: string[], masterQQ: string) {
  const userQQ = await getUnifiedQQ(ctx, session);
if (userQQ !== masterQQ) {
    // 修复：替换裸露字符串为 session.text 调用
    return await session.send(build_msg(session, session.text('error.common.noPermission')))
  }
  let success = 0, repeat = 0, error = 0
  for (const line of card_lines) {
    const info = line.trim().split(/\s+/)
    if (info.length !== 4) { error++; continue }
    const [card_id, card_name, card_star_str, category] = info
    const card_star = parseInt(card_star_str)
    if (isNaN(card_star)) { error++; continue }
    const exist = await ctx.database.get('gacha_card_pool', { card_id })
    if (exist.length) { repeat++; continue }
    await ctx.database.create('gacha_card_pool', { card_id, card_name, card_star, category })
    success++
  }
  await session.send(build_msg(session,
    // 原硬编码：`✅ 卡片信息录入完成！\n成功：${success} 条\n重复：${repeat} 条\n错误：${error} 条`
    session.text('tip.addCard.success', { success, repeat, error }) // 本地化替换
  ));
}

async function _do_draw(
  ctx: Context,
  session: Session,
  draw_times: number,
  star7Threshold: number,
  star6Threshold: number,
  star6Prob: number,
  luckyConfig: PluginConfig
){
  const qq = await getUnifiedQQ(ctx, session);
  const user = await ctx.database.get('gacha_user', { qq });
  if (!user.length) return await session.send(build_msg(session, session.text('error.common.notRegister')));
  const showName = user[0].status === 1 ? user[0].nickname : qq;
  if (!Number.isInteger(draw_times) || draw_times < 1 || draw_times > 20) {
    return await session.send(build_msg(session, session.text('error.draw.count.invalid')));
  }
  const userCount = await ctx.database.get('gacha_user_draw_count', { qq });
  const haveDraw = userCount.length ? userCount[0].draw_count : 0;
  if (haveDraw < draw_times) {
  const leftDraw = haveDraw || 0; // 兜底0值
  return await session.send(build_msg(session, session.text('error.draw.count.notEnough', { 
  count: draw_times.toString(), // 数字转字符串
  left: leftDraw.toString() // 同理
})));
}
  const allCards = await ctx.database.get('gacha_card_pool', {});
  if (allCards.length === 0) {
    return await session.send(build_msg(session, session.text('error.draw.poolEmpty')));
  }
  const starCardMap: Record<number, any[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
  };
  allCards.forEach(card => {
    if (starCardMap[card.card_star] !== undefined) {
      starCardMap[card.card_star].push(card);
    }
  });
  // 普通抽卡星级概率（百分比，支持小数），可配置；Object.entries 对数组同样按 "0".."7" 遍历
  const GACHA_STAR_PROB = parseStarConfig(ctx, luckyConfig.normalStarProbs, 8, [30, 25, 20, 15, 7.5, 2, 0.4, 0.1], '普通抽卡星级概率');
  const STAR_TO_DISTURBANCE = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 5, 5: 20, 6: 100, 7: 500 };
  const INIT_WATER_VAPOR = { 0: 50, 1: 100, 2: 150, 3: 200, 4: 500, 5: 1000, 6: 2000, 7: 5000 };
  const UPGRADE_WATER_VAPOR = { 0: 25, 1: 50, 2: 75, 3: 100, 4: 200, 5: 500, 6: 1000, 7: 2000 };
  const GUARANTEE = {
  star7Threshold: star7Threshold,
  star6Threshold: star6Threshold,
  star6Prob: star6Prob
};
  const drawResult: any[] = [];
  let disturbanceTotal = 0;
  let waterVaporTotal = 0;
  let isUpgrade = false;
  let no6star = userCount.length ? userCount[0].no_6star_draws : 0;
  let no7star = userCount.length ? userCount[0].no_7star_draws : 0;
  const highStarCards: any[] = [];
  const luckyTotal = { disturbance: 0, vapor: 0 };
  for (let i = 0; i < draw_times; i++) {
    let selectedStar: number;
    let guarantee = false;
    if (no7star >= GUARANTEE.star7Threshold) {
      selectedStar = 7;
      guarantee = true;
    } else if (no6star >= GUARANTEE.star6Threshold) {
      const rand = Math.random() * 100;
      selectedStar = rand <= GUARANTEE.star6Prob ? 6 : 7;
      guarantee = true;
    } else {
      const pool: number[] = [];
      for (const [star, prob] of Object.entries(GACHA_STAR_PROB)) {
        const weight = Math.floor(prob * 10);
        for (let j = 0; j < weight; j++) pool.push(+star);
      }
      do {
        selectedStar = pool[Math.floor(Math.random() * pool.length)];
      } while (!starCardMap[selectedStar]?.length);
    }
    const cardList = starCardMap[selectedStar];
    const card = cardList[Math.floor(Math.random() * cardList.length)];
    if (selectedStar === 6 || selectedStar === 7) {
      highStarCards.push({
        star: selectedStar,
        name: card.card_name,
        id: card.card_id
      });
    }
    drawResult.push({ star: selectedStar, cid: card.card_id, name: card.card_name });
    const userCard = await ctx.database.get('gacha_user_card', { qq, card_id: card.card_id });
    if (!userCard.length) {
      await ctx.database.upsert('gacha_user_card', [{
        qq, card_id: card.card_id, card_level: 0
      }]);
      waterVaporTotal += INIT_WATER_VAPOR[selectedStar as 0|1|2|3|4|5|6|7];
      ctx.logger.info(`[普通抽卡] ${showName}(${qq}) 第${i + 1}抽 新增卡片：${card.card_id} ${card.card_name}，等级0`);
    } else {
      const currentLevel = userCard[0].card_level;
      if (currentLevel < CARD_LEVEL_MAX) {
        await ctx.database.upsert('gacha_user_card', [{
          id: userCard[0].id,
          qq, card_id: card.card_id, card_level: currentLevel + 1
        }]);
        isUpgrade = true;
        waterVaporTotal += UPGRADE_WATER_VAPOR[selectedStar as 0|1|2|3|4|5|6|7];
        ctx.logger.info(`[普通抽卡] ${showName}(${qq}) 第${i + 1}抽 卡片升级：${card.card_id}，等级${currentLevel}→${currentLevel+1}`);
      } else {
        const d = STAR_TO_DISTURBANCE[selectedStar as 0|1|2|3|4|5|6|7];
        if (d > 0) disturbanceTotal += d;
        // 0/1/2 星满级重复获得：发放水汽
        const v = MAXED_STAR_TO_VAPOR[selectedStar] || 0;
        if (v > 0) waterVaporTotal += v;
        if (d > 0) {
          ctx.logger.info(`[普通抽卡] ${showName}(${qq}) 第${i + 1}抽 卡片满级：${card.card_id}，转化为${d}热带扰动`);
        } else if (v > 0) {
          ctx.logger.info(`[普通抽卡] ${showName}(${qq}) 第${i + 1}抽 卡片满级：${card.card_id}，转化为${v}水汽`);
        }
      }
    }
    // ⚡ 超级幸运判定：每抽独立触发
    if (rollSuperLucky(luckyConfig, luckyTotal)) {
      ctx.logger.info(`[普通抽卡] ${showName}(${qq}) 第${i + 1}抽触发超级幸运`);
    }
    if (guarantee) {
      if (selectedStar === 7) {
        no7star = 0; no6star++;
      } else {
        no6star = 0; no7star++;
      }
    } else {
      if (selectedStar === 7) {
        no6star++; no7star = 0;
      } else if (selectedStar === 6) {
        no6star = 0; no7star++;
      } else {
        no6star++; no7star++;
      }
    }
  }
  await ctx.database.upsert('gacha_user_draw_count', [{
    qq,
    draw_count: haveDraw - draw_times,
    tropical_disturbance: (userCount.length ? userCount[0].tropical_disturbance : 0) + disturbanceTotal + luckyTotal.disturbance,
    water_vapor: (userCount.length ? userCount[0].water_vapor : 0) + waterVaporTotal + luckyTotal.vapor,
    no_6star_draws: no6star,
    no_7star_draws: no7star
  }]);
  ctx.logger.info(`[普通抽卡] ${showName}(${qq}) 抽卡${draw_times}次，剩余${haveDraw - draw_times}，水汽+${waterVaporTotal}，热带扰动+${disturbanceTotal}，超级幸运：扰动+${luckyTotal.disturbance}、水汽+${luckyTotal.vapor}`);
  // 先算出本条指令要发多少条消息，再决定高星播报要不要带「风王出世」标题。
  // 固定开销：结算结果 1 条（剩余抽数/水汽/扰动都拼在这条里，不单独占条）；超级幸运命中时 +1 条
  const luckyWillSend = luckyTotal.disturbance > 0 || luckyTotal.vapor > 0;
  const fixedCount = 1 + (luckyWillSend ? 1 : 0);
  // 结果消息（先构建，供后续判断是否含升级/水汽/扰动附加行）
  let msg = session.text('tip.draw.complete', { name: showName });
  msg += "\n"
  drawResult.forEach(item => {
    const star = get_star_symbol(item.star);
    msg += `${star} ${item.cid} ${item.name}\n`;
  });
  let info = "";
if (isUpgrade) info += session.text("tip.draw.upgrade"); // 保留升级提示
info += session.text("tip.draw.vapor", { vapor: waterVaporTotal + luckyTotal.vapor });
info += session.text("tip.draw.disturb", { disturbanceTotal: disturbanceTotal + luckyTotal.disturbance });
// 新增：显示剩余普通抽数
info += "\n" + session.text("tip.draw.left", { left: haveDraw - draw_times });
// 修复格式：移除末尾多余的分号
if (info) msg += "\n" + info.replace(/；$/, '');
  // 高星播报：按剩余可用条数自适应（完整 / 省标题 / 合并单条）
  await sendHighStarBroadcast(ctx, session, showName,
    highStarCards.map(c => ({ star: c.star, id: c.id, name: c.name })), fixedCount);
  await session.send(build_msg(session, msg));
  await sendSuperLucky(ctx, session, luckyTotal);
}

async function _do_warehouse(ctx: Context, session: Session) {
  const qq = await getUnifiedQQ(ctx, session);
  const user = await ctx.database.get('gacha_user', { qq })
  if (!user.length) return await session.send(build_msg(session, session.text('error.common.notRegister')))
  const show_name = user[0].status === 1 ? user[0].nickname : qq
  const userCards = await ctx.database.get('gacha_user_card', { qq })
  const cardPool = await ctx.database.get('gacha_card_pool', {})
  const enrichedCards = userCards.map(uc => {
    const cardInfo = cardPool.find(c => c.card_id === uc.card_id)
    return {
      card_level: uc.card_level,
      card_id: uc.card_id,
      card_name: cardInfo?.card_name || '未知',
      card_star: cardInfo?.card_star ?? 0,
    }
  })
  enrichedCards.sort((a, b) => {
    if (a.card_star !== b.card_star) return b.card_star - a.card_star
    return a.card_id.localeCompare(b.card_id)
  })
  // 提前渲染国际化文案
  const titleText = session.text('image.warehouse.title', { name: show_name });
  const emptyText = session.text('image.warehouse.empty');
  // 传入渲染后的文案
  const img_base64 = await _warehouse_draw_image(ctx, userCards, show_name, titleText, emptyText)
  if (!img_base64) return await session.send(build_msg(session, session.text('error.common.imageGenerate')))
  await session.send(img_base64);
}

async function _do_upgrade(ctx: Context, session: Session, card_ids: string[],signResetHour?: number,
  signResetMinute?: number) {
  const qq = await getUnifiedQQ(ctx, session);
  const user = await ctx.database.get('gacha_user', { qq })
  if (!user.length) return await session.send(build_msg(session, session.text('error.common.notRegister')))
  if (!card_ids.length) return await session.send(build_msg(session, session.text('error.upgrade.paramInvalid')))
  ctx.logger.info(`[升格] ${qq} 请求兑换卡片：${card_ids.join(',')}`)

  const cid_count: Record<string, number> = {}
  card_ids.forEach(cid => { cid_count[cid] = (cid_count[cid] || 0) + 1 })

  // ==============================================
  // 🔥 店铺日期计算 → 完全和签到用同一套时间逻辑
  // ==============================================
  const now = new Date();
  let resetHour = signResetHour ?? 0;
  let resetMinute = signResetMinute ?? 0;
  let todayDate = new Date(now);
  todayDate.setHours(resetHour, resetMinute, 0, 0);
  if (now < todayDate) {
    todayDate.setDate(todayDate.getDate() - 1);
  }

  const today = `${todayDate.getFullYear()}${String(todayDate.getMonth() + 1).padStart(2, '0')}${String(todayDate.getDate()).padStart(2, '0')}`;
  ctx.logger.info(`[升格] ${qq} 使用店铺日期：${today}`);
  let total_cost = 0
  const shop_card_info: any[] = []

  // 查询今日店铺卡片+普通卡池信息
  const [shopCards, cardPool] = await Promise.all([
    getShopRowsByDate(ctx, today),
    ctx.database.get('gacha_card_pool', {})
  ]);

  ctx.logger.info(`[升格] 当前店铺卡片:`, shopCards.map(s => s.card_id));

  for (const [cid, num] of Object.entries(cid_count)) {
    const shopCard = shopCards.find(sc => String(sc.card_id) === String(cid));
    if (!shopCard) {
      ctx.logger.warn(`[升格失败] 卡片 ${cid} 不在店铺中`);
      return await session.send(build_msg(session, session.text('error.upgrade.cardNotInShop', { cid })))
    }

    const cardInfo = cardPool.find(cp => String(cp.card_id) === String(cid));
    if (!cardInfo) {
      return await session.send(build_msg(session, session.text('error.upgrade.cardNotInPool', { cid })))
    }

    // 全服限购
    const remaining = Math.max(0, shopCard.server_limit - shopCard.server_bought);
    if (num > remaining) {
      return await session.send(build_msg(session, session.text('error.upgrade.cardLimitExceed', { cid, remaining })))
    }

    for (let i = 0; i < num; i++) {
      shop_card_info.push({
        id: shopCard.id,
        card_id: shopCard.card_id,
        card_name: cardInfo.card_name,
        card_star: shopCard.card_star,
        price: shopCard.price,
        server_bought: shopCard.server_bought,
        server_limit: shopCard.server_limit,
      })
      total_cost += shopCard.price
    }
  }

  // 资源校验
  const user_asset = await ctx.database.get('gacha_user_draw_count', { qq })
  const user_disturbance = user_asset.length ? (user_asset[0].tropical_disturbance ?? 0) : 0;
  if (user_disturbance < total_cost) {
    return await session.send(build_msg(session, session.text('error.upgrade.disturb.notEnough', { have: user_disturbance, need: total_cost })))
  }

  const STAR_TO_DISTURBANCE = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 5, 5: 20, 6: 100, 7: 500 }
  const INIT_WATER_VAPOR = { 0: 50, 1: 100, 2: 150, 3: 200, 4: 500, 5: 1000, 6: 2000, 7: 5000 }
  const UPGRADE_WATER_VAPOR = { 0: 25, 1: 50, 2: 75, 3: 100, 4: 200, 5: 500, 6: 1000, 7: 2000 }

  const upgrade_result: [string, string, string][] = []
  let is_upgrade = false, disturbance_total = 0, water_vapor_total = 0

  for (const card of shop_card_info) {
    const star_symbol = get_star_symbol(card.card_star)
    upgrade_result.push([star_symbol, card.card_id, card.card_name])

    const user_card = await ctx.database.get('gacha_user_card', { qq, card_id: card.card_id })
    if (!user_card.length) {
      await ctx.database.upsert('gacha_user_card', [{ qq, card_id: card.card_id, card_level: 0 }])
      water_vapor_total += INIT_WATER_VAPOR[card.card_star as keyof typeof INIT_WATER_VAPOR]
    } else {
      if (user_card[0].card_level < CARD_LEVEL_MAX) {
        await ctx.database.upsert('gacha_user_card', [{
          id: user_card[0].id,
          qq, card_id: card.card_id, card_level: user_card[0].card_level + 1
        }])
        is_upgrade = true
        water_vapor_total += UPGRADE_WATER_VAPOR[card.card_star as keyof typeof UPGRADE_WATER_VAPOR]
      } else {
        const d = STAR_TO_DISTURBANCE[card.card_star as keyof typeof STAR_TO_DISTURBANCE]
        if (d > 0) disturbance_total += d
      }
    }

    // 更新全服限购（日期统一）
    // 必须带上主键 id：该表主键是 id 而非 card_id，缺 id 的 upsert 会被当成新记录插入，
    // 造成同一张卡在当日店铺里出现重复行（店铺图重复卡片的根因）。
    const shopRow = {
      shop_date: today,
      card_id: card.card_id,
      card_star: card.card_star,
      price: card.price,
      server_limit: card.server_limit,
      server_bought: card.server_bought + 1
    }
    await ctx.database.upsert('gacha_shop_daily', [
      card.id != null ? { id: card.id, ...shopRow } : { ...shopRow }
    ])
  }

  // 更新资产
  await ctx.database.upsert('gacha_user_draw_count', [{
    qq,
    tropical_disturbance: user_disturbance - total_cost + disturbance_total,
    water_vapor: (user_asset.length ? user_asset[0].water_vapor : 0) + water_vapor_total
  }])

  let msg = session.text('tip.upgrade.success') + "\n";
  msg += upgrade_result.map(([s, cid, cname]) => `${s} ${cid} ${cname}`).join("\n")
  msg += "\n" + session.text('tip.upgrade.cost', { total_cost });
  msg += "\n" + session.text('tip.upgrade.water', { water_vapor_total });
  msg += "\n" + session.text('tip.upgrade.disturb', { disturbance_total });
  ctx.logger.info(`用户${qq}升格兑换完成：消耗热带扰动${total_cost}，获得水汽${water_vapor_total}、热带扰动${disturbance_total}`);
  await session.send(build_msg(session, msg));
}

// ==========================
// 普通WWC兑换（彻底修复无限刷BUG：联合主键+精准累加）
// ==========================
/**
 * 普通兑换抽数核心函数（修复表名：改用 gacha_user_exchange 表）
 * 规则：100水汽=1抽 | 每日上限80抽 | 单次1-40抽
 */
async function _do_exchange(ctx: Context, session: Session, exchange_num: number, limit: number,vaporPerDraw: number) {
  const qq = await getUnifiedQQ(ctx, session);

  const todayStart = new Date(new Date().toLocaleDateString()).getTime(); // 今日0点时间戳

  // 1. 基础校验：兑换次数合法性
  if (!Number.isInteger(exchange_num) || exchange_num < 1 || exchange_num > 40) {
    ctx.logger.warn(`[普通兑换抽数] 玩家${qq}兑换失败：次数非法（${exchange_num}抽）`);
    return await session.send(build_msg(session, session.text('error.exchange.count.invalid')));
  }

  // 2. 校验：用户是否注册
  const user = await ctx.database.get('gacha_user', { qq });
  if (!user.length) {
    return await session.send(build_msg(session, session.text('error.common.notRegister')));
  }

  // 3. 校验：今日兑换次数是否超限（核心修复：查询 gacha_user_exchange 表）
  const exchangeRecord = await ctx.database.get('gacha_user_exchange', {
    qq,
    create_at: { $gte: todayStart } // 按今日时间戳筛选
  });
  const usedToday = exchangeRecord.length ? exchangeRecord[0].count : 0;
  const totalApply = usedToday + exchange_num;

  if (totalApply >limit ) {
    const left = limit - usedToday;
    ctx.logger.warn(`[普通兑换抽数] 玩家${qq}兑换失败：今日超限（已兑${usedToday}抽，申请${exchange_num}抽，上限${limit}抽）`);
    return await session.send(build_msg(session,
      session.text('error.exchange.dailyLimit', { used: usedToday, apply: exchange_num, limit: limit, left })
    ));
  }

  // 4. 校验：水汽余额是否足够
  const asset = await ctx.database.get('gacha_user_draw_count', { qq });
  const currentVapor = asset[0]?.water_vapor ?? 0;
  const totalCost = exchange_num * vaporPerDraw;

  if (currentVapor < totalCost) {
    ctx.logger.warn(`[普通兑换抽数] 玩家${qq}兑换失败：水汽不足（拥有${currentVapor}，需${totalCost}）`);
    return await session.send(build_msg(session,
      session.text('error.exchange.vapor.notEnough', { need: totalCost, have: currentVapor })
    ));
  }

  // 5. 核心操作：扣减水汽+新增抽数
  const newDrawCount = (asset[0]?.draw_count ?? 0) + exchange_num;
  const newVapor = currentVapor - totalCost;

  await ctx.database.upsert('gacha_user_draw_count', [{
    qq,
    water_vapor: newVapor,
    draw_count: newDrawCount,
    tropical_disturbance: asset[0]?.tropical_disturbance ?? 0,
    no_6star_draws: asset[0]?.no_6star_draws ?? 0,
    no_7star_draws: asset[0]?.no_7star_draws ?? 0,
  }]);
  ctx.logger.info(`[普通兑换抽数] 玩家${qq}资产更新：水汽${currentVapor}→${newVapor}（扣减${totalCost}），抽数${asset[0]?.draw_count ?? 0}→${newDrawCount}`);

  // 6. 更新今日兑换记录（核心修复：写入 gacha_user_exchange 表）
  await ctx.database.upsert('gacha_user_exchange', [{
    qq,
    create_at: todayStart, // 统一用今日0点时间戳作为分组键
    count: totalApply
  }]);

  // 7. 计算剩余兑换次数
  const leftToday = Math.max(0, limit - totalApply);

  // 8. 发送兑换成功消息（本地化）
  await session.send(build_msg(session,
    `${session.text('tip.exchange.success')}\n${session.text('tip.exchange.info', { 
      count: exchange_num, 
      cost: totalCost, 
      used: totalApply, 
      limit: limit, 
      left: leftToday 
    })}`
  ));
  ctx.logger.info(`[普通兑换抽数] 玩家${qq}兑换成功：获得${exchange_num}抽，今日剩余${leftToday}抽`);
}

// 收藏图分片默认正则（可在插件配置项中覆盖）：
// part1 = 纯数字且≥2000（如 2000、9999、12345）；part2 = 纯数字且<2000（如 0、999、1999）
// 两个正则都不匹配的类别归入 WWC收藏3
const DEFAULT_COLLECTION_PART1_PATTERN = '^([2-9]\\d{3}|\\d{5,})$';
const DEFAULT_COLLECTION_PART2_PATTERN = '^(\\d{1,3}|1\\d{3})$';

function compileCollectionPatterns(ctx: Context, part1?: string, part2?: string) {
  const compile = (pattern: string | undefined, fallback: string, label: string) => {
    const source = (pattern ?? '').trim() || fallback;
    try {
      return new RegExp(source);
    } catch (e) {
      ctx.logger.warn(`收藏图${label}分类正则无效（${source}），已回退默认规则`);
      return new RegExp(fallback);
    }
  };
  return {
    part1: compile(part1, DEFAULT_COLLECTION_PART1_PATTERN, '1'),
    part2: compile(part2, DEFAULT_COLLECTION_PART2_PATTERN, '2')
  };
}

type CollectionPatterns = ReturnType<typeof compileCollectionPatterns>;

// part：收藏图分片（不传=全部）
// 分类规则由配置项 collectionPart1Pattern / collectionPart2Pattern 决定（正则匹配类别名）：
// 1 = 匹配 part1 正则；2 = 匹配 part2 正则；3 = 两个正则都不匹配；不传 = 全部
async function _do_collection(ctx: Context, session: Session, part?: 1 | 2 | 3, patterns?: CollectionPatterns) {
  const partPatterns = patterns ?? compileCollectionPatterns(ctx);
  ctx.logger.info(`收到指令：WWC收藏${part ?? ''}（含限定卡+灰色占位）`);
  try {
    const qq = await getUnifiedQQ(ctx, session);
    const user = await ctx.database.get('gacha_user', { qq });
    if (!user.length) return await session.send(h.text(session.text('error.common.notRegister')));
    const show_name = user[0].status === 1 ? user[0].nickname : qq;

    // 1. 获取用户已拥有卡片ID
    const userCards = await ctx.database.get('gacha_user_card', { qq });
    const userCardIds = new Set(userCards.map(uc => uc.card_id));

    // 2. 双表查询普通卡+限时卡，统一数据结构
    const [normalCards, eventCards] = await Promise.all([
      ctx.database.get('gacha_card_pool', {}),
      ctx.database.get('gacha_event_pool', {})
    ]);

    // 3. 合并所有卡片（去重，普通卡优先，老代码极简逻辑）
    const allCardMap = new Map();
    // 处理普通卡：分类兜底为「未分类」
    normalCards.forEach(c => {
      if (!allCardMap.has(c.card_id)) {
        allCardMap.set(c.card_id, {
          id: c.card_id,
          name: c.card_name,
          star: c.card_star,
          category: c.category || "未分类",
          isLimit: false
        });
      }
    });
    // 处理限时卡：分类兜底为「限时分类」，红色边框标记
    eventCards.forEach(c => {
      if (!allCardMap.has(c.card_id)) {
        allCardMap.set(c.card_id, {
          id: c.card_id,
          name: unescapeHtml(c.card_name),
          star: c.card_star,
          category: c.card_type || "限时分类",
          isLimit: true
        });
      }
    });

    const allCards = Array.from(allCardMap.values());

    // 按指令分片过滤（规则来自配置项正则，匹配类别名）：
    // 1 = 匹配 part1 正则；2 = 匹配 part2 正则；3 = 两者都不匹配；不传 = 全部
    const isTargetCategory = (cate: string) => {
      if (!part) return true;
      const c = cate || '';
      if (part === 1) return partPatterns.part1.test(c);
      if (part === 2) return partPatterns.part2.test(c);
      return !partPatterns.part1.test(c) && !partPatterns.part2.test(c);
    };
    const partCards = allCards.filter(c => isTargetCategory(c.category));

    const totalAll = partCards.length;
    const totalCollected = partCards.filter(c => userCardIds.has(c.id)).length;
    const totalRate = totalAll > 0 ? ((totalCollected / totalAll) * 100).toFixed(1) : "0.0";

    // 4. 老代码核心：极简分类分组（无复杂解构，直接分组，绝对无空值）
    const categoryGroup = {};
    partCards.forEach(card => {
      const cate = card.category || "未分类"; // 强制兜底，老代码核心
      if (!categoryGroup[cate]) categoryGroup[cate] = [];
      categoryGroup[cate].push({
        ...card,
        isCollected: userCardIds.has(card.id) // 标记是否收集，用于灰色？
      });
    });
    const categories = Object.keys(categoryGroup).sort(); // 直接取分类名，无过滤

    // 5. 文案渲染（简化，避免模板替换空值，老代码兼容；标题按分片区分）
    const titleKey =
      part === 1 ? "image.collection.title1" :
      part === 2 ? "image.collection.title2" :
      part === 3 ? "image.collection.title3" :
      "image.collection.title";
    const titleText = session.text(titleKey, { showName: show_name });
    const totalText = session.text("image.collection.totalProgress", {
      collected: totalCollected,
      total: totalAll,
      rate: totalRate
    });
    const emptyText = session.text("image.collection.emptyText");

    // 6. 调用绘图函数（传递极简参数，无复杂对象，避免解析报错）
    const img = await _collection_draw_image(
      ctx,
      session,
      titleText,
      totalText,
      emptyText,
      categories,
      categoryGroup,
      totalCollected
    );
    if (!img) return await session.send(h.text(session.text('error.common.imageGenerate')));
    await session.send(img);
  } catch (e) {
    ctx.logger.error('WWC收藏执行异常：', e);
    await session.send(h.text(session.text('error.collection.fail')));
  }
}

async function _do_shop(ctx: Context, session: Session,signResetHour?: number,
  signResetMinute?: number) {
  ctx.logger.info('收到指令：WWC店铺（按签到时间刷新版）');
  try {
    const qq = await getUnifiedQQ(ctx, session);
    const user = await ctx.database.get('gacha_user', { qq });
    if (!user.length) return await session.send(h.text(session.text('error.common.notRegister')));
    const showName = user[0].status === 1 ? user[0].nickname : qq;

    // ==============================================
    // 🔥 店铺日期计算 → 完全和签到用同一套时间逻辑
    // ==============================================
    const now = new Date();
    let resetHour = signResetHour ?? 0;
    let resetMinute = signResetMinute ?? 0;

    let todayDate = new Date(now);
    todayDate.setHours(resetHour, resetMinute, 0, 0);
    if (now < todayDate) {
      todayDate.setDate(todayDate.getDate() - 1);
    }

    const today = `${todayDate.getFullYear()}${String(todayDate.getMonth() + 1).padStart(2, '0')}${String(todayDate.getDate()).padStart(2, '0')}`;

    // 读取今日店铺（按 card_id 去重，兼容历史脏数据）
    let todayShop = await getShopRowsByDate(ctx, today);

    if (todayShop.length === 0) {
      const [sevenStarCards, sixStarCards, fiveStarCards] = await Promise.all([
        ctx.database.get('gacha_card_pool', { card_star: 7 }),
        ctx.database.get('gacha_card_pool', { card_star: 6 }),
        ctx.database.get('gacha_card_pool', { card_star: 5 })
      ]);
      if (sevenStarCards.length < 4 || sixStarCards.length < 6 || fiveStarCards.length < 10) {
        return await session.send(h.text(session.text('error.shop.cardNotEnough')));
      }

      const selected7 = sevenStarCards.sort(() => Math.random() - 0.5).slice(0, 4);
      const selected6 = sixStarCards.sort(() => Math.random() - 0.5).slice(0, 6);
      // 新增：普通卡池随机10个5星，排在6星后面，同样每天随签到时间刷新
      const selected5 = fiveStarCards.sort(() => Math.random() - 0.5).slice(0, 10);
      // 按 card_id 去重后再写入，避免同一卡片在当日店铺里出现多行
      const allCards = Array.from(
        new Map([...selected7, ...selected6, ...selected5].map(c => [String(c.card_id), c])).values()
      );

      // 每日价格：7星 800±80，6星 200±30；5星固定20扰动（无浮动）
      const SHOP_PRICE_BASE = { 7: 800, 6: 200, 5: 20 };
      const SHOP_PRICE_RANGE = { 7: 80, 6: 30, 5: 0 };

      for (const card of allCards) {
        const basePrice = SHOP_PRICE_BASE[card.card_star] ?? 10;
        const range = SHOP_PRICE_RANGE[card.card_star] ?? 0;
        const randomPrice = range > 0
          ? basePrice + Math.floor(Math.random() * (range * 2 + 1)) - range
          : basePrice;
        const nextId = await getNextId(ctx, 'gacha_shop_daily');
await ctx.database.create('gacha_shop_daily', {
  id: nextId,
  shop_date: today,
  card_id: card.card_id,
  card_star: card.card_star,
  price: randomPrice,
  server_bought: 0,
  server_limit: 5
});
      }
      todayShop = await getShopRowsByDate(ctx, today);
    }

    const pool = await ctx.database.get('gacha_card_pool', {});
    const poolMap = new Map(pool.map(p => [p.card_id, p]));

    const shopCardList = todayShop.map(item => {
      const card = poolMap.get(item.card_id);
      // 每日限购剩余 = 当日全服限购额度 - 当日已购次数，
      // 与 WWC升格 的实际校验口径（server_limit - server_bought）保持一致。
      // 注意：不要再改回读 gacha_shop_limit.left_limit——那是个从不被扣减的旧字段，图上会永远显示 5。
      const limit = item.server_limit ?? 5;
      const bought = item.server_bought ?? 0;
      return {
        id: item.card_id,
        name: card?.card_name || '未知',
        star: item.card_star,
        price: item.price,
        leftLimit: Math.max(0, limit - bought)
      };
    });
    // 固定展示顺序：7星 → 6星 → 5星（同星级按卡片编号），保证5星始终排在6星之后
    shopCardList.sort((a, b) => (b.star - a.star) || String(a.id).localeCompare(String(b.id)));

    const userAsset = await ctx.database.get('gacha_user_draw_count', { qq });
    const dist = userAsset[0]?.tropical_disturbance ?? 0;
    const vapor = userAsset[0]?.water_vapor ?? 0;
    const drawLeft = userAsset[0]?.draw_count ?? 0;

    const img = await _shop_draw_image(
      ctx, session, showName, today, dist, vapor, drawLeft, 0, 0, shopCardList
    );
    if (!img) return await session.send(h.text(session.text('error.common.imageGenerate')));
    await session.send(img);

  } catch (e) {
    ctx.logger.error('WWC店铺报错：', e);
    await session.send(h.text('店铺加载失败'));
  }
}

async function _do_ranking(ctx: Context, session: Session) {
  ctx.logger.info("WWC排名1 开始执行");
  try {
    const qq = await getUnifiedQQ(ctx, session);
    const user = await ctx.database.get('gacha_user', { qq });
    if (!user.length) {
      await session.send(build_msg(session, session.text('error.common.notRegister')));
      return;
    }
    const show_name = user[0].status === 1 ? user[0].nickname : qq;
    const all_users = await ctx.database.get('gacha_user', {});
    const ranking_data: any[] = [];
    // 遍历所有用户，统计收藏数量
    for (const u of all_users) {
      try {
        const cards = await ctx.database.get('gacha_user_card', { qq: u.qq }, { fields: ['card_id'] });
        const collected_num = new Set(cards.map(c => c.card_id)).size;
        ranking_data.push({
          qq: u.qq,
          show_name: u.status === 1 ? u.nickname : u.qq,
          collected_num
        });
      } catch (e) {
        continue;
      }
    }
    // 排序：收藏数从高到低
    ranking_data.sort((a, b) => b.collected_num - a.collected_num);
    // 构建排行列表
    const ranking_list: any[] = [];
    let user_rank = 0;
    let user_collected = 0;
    ranking_data.forEach((item, idx) => {
      const rank = idx + 1;
      if (item.qq === qq) {
        user_rank = rank;
        user_collected = item.collected_num;
      }
      if (rank <= 20) {
        ranking_list.push([rank, item.show_name, item.collected_num]);
      }
    });
    // 提前渲染国际化文案
    const titleText = session.text('image.ranking.title');
    const headerRankText = session.text('image.ranking.header.rank');
    const headerPlayerText = session.text('image.ranking.header.player');
    const headerCountText = session.text('image.ranking.header.count');
    const mineText = session.text('image.ranking.mine', { rank: user_rank, count: user_collected });
    // 生成图片
    const img_base64 = await _ranking_draw_image(
      ctx,
      ranking_list,
      user_rank,
      user_collected,
      show_name,
      titleText,
      headerRankText,
      headerPlayerText,
      headerCountText,
      mineText
    );
    if (img_base64) {
      await session.send(img_base64);
      ctx.logger.info("WWC排名1 图片发送成功");
    } else {
      await session.send(build_msg(session, session.text('error.common.imageGenerate')));
    }
  } catch (e) {
    ctx.logger.error("WWC排名1 报错：", e);
    await session.send(build_msg(session, session.text('error.ranking.fail')));
  }
}

// WWC排名2：按7/6星战力分排行
// 计分规则：每张7星 0级20分、每升1级+15；每张普通6星 0级5分、每升1级+3；每张限时6星 0级8分、每升1级+6
// 与排名1使用同一绘图函数，仅文案/数据不同
async function _do_ranking2(ctx: Context, session: Session) {
  ctx.logger.info("WWC排名2 开始执行");
  try {
    const qq = await getUnifiedQQ(ctx, session);
    const user = await ctx.database.get('gacha_user', { qq });
    if (!user.length) {
      await session.send(build_msg(session, session.text('error.common.notRegister')));
      return;
    }
    const show_name = user[0].status === 1 ? user[0].nickname : qq;

    // 预加载全量卡池（普通+限时），确定每张卡片的来源与星级；普通卡优先（与收藏图口径一致）
    const [normalPoolCards, eventPoolCards] = await Promise.all([
      ctx.database.get('gacha_card_pool', {}, { fields: ['card_id', 'card_star'] }),
      ctx.database.get('gacha_event_pool', {}, { fields: ['card_id', 'card_star'] })
    ]);
    const poolInfo = new Map<string, { star: number; isLimit: boolean }>();
    normalPoolCards.forEach(c => {
      if (!poolInfo.has(c.card_id)) poolInfo.set(c.card_id, { star: c.card_star, isLimit: false });
    });
    eventPoolCards.forEach(c => {
      if (!poolInfo.has(c.card_id)) poolInfo.set(c.card_id, { star: c.card_star, isLimit: true });
    });

    const all_users = await ctx.database.get('gacha_user', {});
    const ranking_data: any[] = [];
    // 遍历所有用户，累计7/6星战力分
    for (const u of all_users) {
      try {
        const cards = await ctx.database.get('gacha_user_card', { qq: u.qq }, { fields: ['card_id', 'card_level'] });
        // 同一卡片多行记录按最高等级计一次分
        const levelMap = new Map<string, number>();
        cards.forEach(c => {
          const lv = c.card_level || 0;
          const prev = levelMap.get(c.card_id);
          if (prev === undefined || lv > prev) levelMap.set(c.card_id, lv);
        });
        let totalScore = 0;
        levelMap.forEach((lv, cid) => {
          const info = poolInfo.get(cid);
          if (!info) return; // 已不在卡池中的卡片不计分
          if (info.star >= 7) totalScore += 20 + 15 * lv;
          else if (info.star === 6) totalScore += info.isLimit ? 8 + 6 * lv : 5 + 3 * lv;
        });
        ranking_data.push({
          qq: u.qq,
          show_name: u.status === 1 ? u.nickname : u.qq,
          total_score: totalScore
        });
      } catch (e) {
        continue;
      }
    }
    // 排序：战力分从高到低
    ranking_data.sort((a, b) => b.total_score - a.total_score);
    // 构建排行列表
    const ranking_list: any[] = [];
    let user_rank = 0;
    let user_score = 0;
    ranking_data.forEach((item, idx) => {
      const rank = idx + 1;
      if (item.qq === qq) {
        user_rank = rank;
        user_score = item.total_score;
      }
      if (rank <= 20) {
        ranking_list.push([rank, item.show_name, item.total_score]);
      }
    });
    // 提前渲染国际化文案（表头"数量"列显示为综合得分）
    const titleText = session.text('image.ranking2.title');
    const headerRankText = session.text('image.ranking.header.rank');
    const headerPlayerText = session.text('image.ranking.header.player');
    const headerCountText = session.text('image.ranking2.header.score');
    const mineText = session.text('image.ranking2.mine', { rank: user_rank, score: user_score });
    // 复用排名1的绘图函数，生成图片
    const img_base64 = await _ranking_draw_image(
      ctx,
      ranking_list,
      user_rank,
      user_score,
      show_name,
      titleText,
      headerRankText,
      headerPlayerText,
      headerCountText,
      mineText
    );
    if (img_base64) {
      await session.send(img_base64);
      ctx.logger.info("WWC排名2 图片发送成功");
    } else {
      await session.send(build_msg(session, session.text('error.common.imageGenerate')));
    }
  } catch (e) {
    ctx.logger.error("WWC排名2 报错：", e);
    await session.send(build_msg(session, session.text('error.ranking.fail')));
  }
}

async function _do_switch(ctx: Context, session: Session, type: "global" | "group", action: "open" | "close", masterQQ: string) {
  const userQQ = await getUnifiedQQ(ctx, session);
if (userQQ !== masterQQ) {
    ctx.logger.warn(`非主人QQ${(session as any).unifiedQQ || session.userId}尝试操作开关，已拦截`)
    return await session.send(build_msg(session, session.text('error.common.noPermission')))
  }
  const status = action === "open" ? 1 : 0
  try {
    if (type === "global") {
      await ctx.database.upsert('gacha_global_switch', [{ id: 1, status }])
      ctx.logger.info(`全局开关已${action === "open" ? "开启" : "关闭"}，状态：${status}`)
      await session.send(build_msg(session, status ? session.text('tip.switch.globalOpen') : session.text('tip.switch.globalClose')))
    } else if (type === "group") {
      if (session.channelId?.startsWith('private')) {
        return await session.send(build_msg(session, session.text('error.switch.private')))
      }
      const group_id = session.guildId as string
      await ctx.database.upsert('gacha_group_switch', [{ group_id, status }])
      ctx.logger.info(`群${group_id}开关已${action === "open" ? "开启" : "关闭"}，状态：${status}`)
      await session.send(build_msg(session, status ? session.text('tip.switch.groupOpen') : session.text('tip.switch.groupClose')))
    }
  } catch (e) {
    ctx.logger.error(`开关操作失败：`, e)
    await session.send(build_msg(session, session.text('error.switch.fail', { msg: (e as Error).message })))
  }
}

// 修复：getOpenEventPool 函数（返回前还原名称）
async function getOpenEventPool(ctx: Context) {
  const now = new Date().getTime();
  const allPools = await ctx.database.get('gacha_event_pool', {});

  ctx.logger.debug(`卡池检查：北京时间戳${now}，池列表：${allPools.map(p => `${p.code}(${p.card_star}星,${now >= p.start_at && now <= p.end_at ? '开放' : '未开放'})`).join('、')}`);
  
  // 🔥 核心修复：返回前还原每个卡池的名称
  const openPools = allPools
    .filter(p => now >= p.start_at && now <= p.end_at)
    .map(p => ({
      ...p,
      card_name: p.card_name.replace(/&amp;/gi, '&') // 手动兜底替换
    }));
  
  return openPools;
}

// ==========================
// 1. 主人：限时录入（兼容数字类别，和普通卡池一致，按老代码修正）
// ==========================
async function _do_event_add(
  ctx: Context,
  session: Session,
  data: string,
  masterQQ: string
) {
  const userQQ = await getUnifiedQQ(ctx, session);
  if (userQQ !== masterQQ) {
    return await session.send(build_msg(session, session.text('error.common.noPermission')));
  }
  const arr = data.split(/\s+/).filter(Boolean);
  if (arr.length < 7) {
    return await session.send(build_msg(session, session.text('error.eventAdd.format')));
  }
  const [code, card_id, card_name, starStr, card_type, startStr, endStr] = arr;
  // 🔥 核心修复：录入时还原转义字符，避免存储污染
  const pureCardName = unescapeHtml(card_name);
  const card_star = parseInt(starStr);
  const start_at = parseInt(startStr);
  const end_at = parseInt(endStr);
  
  if (![6,7].includes(card_star)) return await session.send(build_msg(session, session.text('error.eventAdd.star.invalid')));
  if (isNaN(start_at) || isNaN(end_at) || end_at <= start_at) {
    return await session.send(build_msg(session, session.text('error.eventAdd.time.invalid')));
  }
  
  await ctx.database.upsert('gacha_event_pool', [{
    code, 
    card_id, 
    card_name: pureCardName, // 存入还原后的名称
    card_star, 
    card_type, 
    start_at, 
    end_at, 
    created_at: Date.now()
  }]);
  ctx.logger.info(session.text('tip.eventAdd.success', { code }));
  await session.send(build_msg(session, session.text('tip.eventAdd.success', { code })));
}

// 限时状态 - 终极硬编版（完全不依赖文案模板，100%生效）
async function _do_event_status(ctx: Context, session: Session) {
  const now = new Date().getTime();
  // 直接查询数据库，不经过任何中间函数
  const allPools = await ctx.database.get('gacha_event_pool', {});
  const openPools = allPools.filter(p => now >= p.start_at && now <= p.end_at);
  
  if (openPools.length === 0) {
    return await session.send(build_msg(session, "当前无开启的限时卡池～"));
  }
  
  const msg = openPools.map(p => {
    const start = new Date(p.start_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const end = new Date(p.end_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    // 🔥 终极硬替换：连续4次替换，覆盖所有可能的转义残留
    const cardName = p.card_name
      .replace(/&amp;/g, '&')       // 普通替换
      .replace(/&amp;/gi, '&')      // 大小写不敏感替换
      .replace(/&#x26;/g, '&')      // 十六进制转义替换
      .replace(/&AMP;/g, '&');      // 全大写转义替换
    // 🔥 直接拼接消息，不使用任何文案模板，彻底避免参数转义
    return `📅 限时卡池【${p.code}】
卡片：${cardName}（${p.card_star}星）
类型：${p.card_type}
开放时间：${start} ~ ${end}`;
  }).join('\n\n');
  
  await session.send(build_msg(session, msg));
}

// ==========================
// 3. 限时兑换（1~40抽，按老代码修正）
// ==========================
async function _do_event_exchange(
  ctx: Context,
  session: Session,
  data: { code: string; cnt: number },
  price6: number,
  price7: number
) {
  const qq = await getUnifiedQQ(ctx, session);
  const { code, cnt } = data;
  const realCnt = Math.min(Math.max(cnt | 0, 1), 40);
  const user = await ctx.database.get('gacha_user', { qq });
  if (!user.length) return await session.send(build_msg(session, session.text('error.common.notRegister')));
  const showName = user[0].status === 1 ? user[0].nickname : qq;

  const events = await getOpenEventPool(ctx);
  const ev = events.find(e => e.code === code);
  if (!ev) return await session.send(build_msg(session, session.text('error.eventExchange.pool.none')));
  const star = ev.card_star;
  const price = star === 6 ? price6 : price7;
  const total = price * realCnt;
  const asset = await ctx.database.get('gacha_user_draw_count', { qq });
  const vapor = asset[0]?.water_vapor ?? 0;
  if (vapor < total) return await session.send(build_msg(session, session.text('error.exchange.vapor.notEnough', { need: total, have: vapor })));
  await ctx.database.upsert('gacha_user_draw_count', [{ qq, water_vapor: vapor - total }]);
  const ud = await ctx.database.get('gacha_user_event_draw', { qq });
  const old = ud[0] ?? { draw6:0, draw7:0 };
  const key = `draw${star}`;
  await ctx.database.upsert('gacha_user_event_draw', [{ qq, [key]: Number(old[key as keyof typeof old]) + realCnt }]);
  ctx.logger.info(`[限时兑换] ${showName}(${qq}) 卡池${code} 兑换${realCnt}抽，消耗水汽${total}（${vapor}→${vapor - total}），${star}星限时抽数余额${Number(old[key as keyof typeof old]) + realCnt}`);
  await session.send(build_msg(session,
    session.text('tip.eventExchange.success', { code, count: realCnt, cost: total })
  ));
}

// ==========================
// 限时抽卡 - 终极保底版（取消普通保底+累计抽数保底）
// 规则：6星200抽保底/7星400抽保底 | 每期限定独立计数 | 仅触发1次
// ==========================
async function _do_event_draw(
  ctx: Context,
  session: Session,
  data: number | string | undefined,
  event6Threshold: number,
  event7Threshold: number,
  luckyConfig: PluginConfig
){
  const qq = await getUnifiedQQ(ctx, session);
  let code: string = '';
  let count: number = 1;
  if (typeof data === 'number') {
    count = data;
    const openPools = await getOpenEventPool(ctx);
    if (openPools.length === 0) return await session.send(build_msg(session, session.text('error.eventStatus.none')));
    if (openPools.length > 1) return await session.send(build_msg(session, session.text('error.eventDraw.pool.many')));
    code = openPools[0].code;
  } else if (typeof data === 'string') {
    const arr = data.split(/\s+/).filter(Boolean);
    code = arr[0] || '';
    count = parseInt(arr[1]) || 1;
  } else {
    // 处理 undefined 情况
    return await session.send(build_msg(session, session.text('error.eventDraw.param.invalid')));
  }
  count = Math.min(Math.max(count, 1), 20);
  const user = await ctx.database.get('gacha_user', { qq });
  if (!user.length) return await session.send(build_msg(session, session.text('error.common.notRegister')));
  const showName = user[0].status === 1 ? user[0].nickname : qq;
  const openPools = await getOpenEventPool(ctx);
  const eventCard = openPools.find(p => p.code === code);
  if (!eventCard) return await session.send(build_msg(session, session.text('error.eventDraw.pool.invalid', { code })));
  const limitStar = eventCard.card_star;
  const ud = await ctx.database.get('gacha_user_event_draw', { qq });
  const key = `draw${limitStar}` as 'draw6' | 'draw7';;
  const have = ud[0]?.[key] ?? 0;
if (have < count) {
  return await session.send(build_msg(session, session.text('error.eventDraw.count.notEnough', { 
    star: limitStar, 
    have: have, // 明确传递have参数
    need: count 
  })));
}
  let pityRecord = await ctx.database.get('gacha_user_event_pity', { qq, event_code: code });
  if (!pityRecord.length) {
    await ctx.database.upsert('gacha_user_event_pity', [{
      qq,
      event_code: code,
      pity6: 0,
      pity7: 0,
      got6: false,
      got7: false
    }]);
    pityRecord = await ctx.database.get('gacha_user_event_pity', { qq, event_code: code });
    
  }
  const currentPity = {
    pityCount: limitStar === 6 ? pityRecord[0].pity6 || 0 : pityRecord[0].pity7 || 0,
    hasGot: limitStar === 6 ? pityRecord[0].got6 || false : pityRecord[0].got7 || false
  };
  const threshold = limitStar === 6 ? event6Threshold : event7Threshold;
  // 历史脏数据自愈：旧版硬保底触发后没有写「本期已获得」，计数会越过阈值一路累加，
  // 显示时left = threshold - pityCount 就变成负数。计数既然已达阈值，说明硬保底必然已发放过，
  // 这里按事实补齐标记并把计数归零，玩家下次抽卡时自动修正，无需手动改库。
  if (!currentPity.hasGot && currentPity.pityCount >= threshold) {
    ctx.logger.warn(`[限时保底修复] ${showName}(${qq}) 卡池${code}：计数${currentPity.pityCount}≥阈值${threshold}却未标记已获得，按已触发硬保底修正`);
    currentPity.hasGot = true;
    currentPity.pityCount = 0;
  }
  await ctx.database.upsert('gacha_user_event_draw', [{ qq, [key]: have - count }]);
  ctx.logger.info(`[限时抽卡] ${showName}(${qq}) 卡池${code} 扣除${count}次${limitStar}星限时抽数，剩余${have - count}次`);
  const normalCards = await ctx.database.get('gacha_card_pool', {});
  const pool0 = normalCards.filter(c => c.card_star === 0);
  const pool1 = normalCards.filter(c => c.card_star === 1);
  const pool2 = normalCards.filter(c => c.card_star === 2);
  const pool3 = normalCards.filter(c => c.card_star === 3);
  const pool4 = normalCards.filter(c => c.card_star === 4);
  const pool5 = normalCards.filter(c => c.card_star === 5);
  const pool6 = normalCards.filter(c => c.card_star === 6);
  const pool7 = normalCards.filter(c => c.card_star === 7);
  const drawResult: any[] = [];
  const highStarCards: any[] = [];
  // 限时抽卡星级权重（相对比例），按 0~7 星逗号分隔，可配置
  const STAR_POOL_WEIGHT = {
    6: parseStarConfig(ctx, luckyConfig.eventPool6Weights, 8, [3000, 2500, 2000, 1500, 700, 150, 140, 10], '限时6星池权重')
      .map((weight, star) => ({ star, weight })),
    7: parseStarConfig(ctx, luckyConfig.eventPool7Weights, 8, [3000, 2500, 2000, 1500, 750, 150, 100, 50], '限时7星池权重')
      .map((weight, star) => ({ star, weight })),
  };
  const currentPoolConfig = STAR_POOL_WEIGHT[limitStar as 6 | 7];
  const probabilityPool: number[] = [];
  currentPoolConfig.forEach(item => {
    for (let i = 0; i < item.weight; i++) {
      probabilityPool.push(item.star);
    }
  });
  const luckyTotal = { disturbance: 0, vapor: 0 };
  let newPityCount = currentPity.pityCount;
  for (let i = 0; i < count; i++) {
    let drawCard: any;
    newPityCount++;
    const isGuarantee = !currentPity.hasGot && newPityCount >= threshold;
    if (isGuarantee) {
      drawCard = eventCard;
      // 硬保底拿到卡后必须标记「本期已获得」并清零计数：
      // 否则 hasGot 仍为 false、计数继续累加越过阈值，
      // 显示的保底进度会算出负数，且「已获得」状态永不显示。
      currentPity.hasGot = true;
      newPityCount = 0;
      ctx.logger.info(`[限时累计保底触发] ${showName}(${qq}) 抽卡${code}期，累计${currentPity.pityCount + 1}抽，保底获得${limitStar}星限时卡：${eventCard.card_name}`);
    } else {
      const randIndex = Math.floor(Math.random() * probabilityPool.length);
      const selectedStar = probabilityPool[randIndex];
      switch (selectedStar) {
        case 0: drawCard = pool0[Math.floor(Math.random() * pool0.length)]; break;
        case 1: drawCard = pool1[Math.floor(Math.random() * pool1.length)]; break;
        case 2: drawCard = pool2[Math.floor(Math.random() * pool2.length)]; break;
        case 3: drawCard = pool3[Math.floor(Math.random() * pool3.length)]; break;
        case 4: drawCard = pool4[Math.floor(Math.random() * pool4.length)]; break;
        case 5: drawCard = pool5[Math.floor(Math.random() * pool5.length)]; break;
        case 6:
          if (limitStar === 6 && Math.random() < 0.25) {
            drawCard = eventCard;
            newPityCount = 0;
            currentPity.hasGot = true;
          } else {
            drawCard = pool6[Math.floor(Math.random() * pool6.length)];
          }
          highStarCards.push(drawCard);
          break;
        case 7:
          if (limitStar === 7 && Math.random() < 0.5) {
            drawCard = eventCard;
            newPityCount = 0;
            currentPity.hasGot = true;
          } else {
            drawCard = pool7[Math.floor(Math.random() * pool7.length)];
          }
          highStarCards.push(drawCard);
          break;
        default: drawCard = pool0[Math.floor(Math.random() * pool0.length)];
      }
    }
    drawResult.push(drawCard);
    if (isGuarantee && [6,7].includes(drawCard.card_star)) {
      highStarCards.push(drawCard);
    }
    // ⚡ 超级幸运判定：每抽独立触发
    if (rollSuperLucky(luckyConfig, luckyTotal)) {
      ctx.logger.info(`[限时抽卡] ${showName}(${qq}) 第${i + 1}抽触发超级幸运`);
    }
  }
  const updatePityData = {
    qq,
    event_code: code,
    pity6: limitStar === 6 ? newPityCount : pityRecord[0].pity6,
    pity7: limitStar === 7 ? newPityCount : pityRecord[0].pity7,
    got6: limitStar === 6 ? currentPity.hasGot : pityRecord[0].got6,
    got7: limitStar === 7 ? currentPity.hasGot : pityRecord[0].got7
  };
  await ctx.database.upsert('gacha_user_event_pity', [updatePityData]);
  ctx.logger.info(`[限时保底记录更新] ${showName}(${qq}) 卡池${code}，累计抽数：${newPityCount}，已获得：${currentPity.hasGot}`);
  let msg = session.text('tip.draw.complete', { name: showName }) + "\n";
  drawResult.forEach(card => {
    const starSymbol = get_star_symbol(card.card_star);
    msg += `${starSymbol} ${card.card_id} ${card.card_name}\n`;
  });
  const STAR_TO_DISTURBANCE = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 5, 5: 20, 6: 100, 7: 500 };
  const INIT_WATER_VAPOR = { 0: 50, 1: 100, 2: 150, 3: 200, 4: 500, 5: 1000, 6: 2000, 7: 5000 };
  const UPGRADE_WATER_VAPOR = { 0: 25, 1: 50, 2: 75, 3: 100, 4: 200, 5: 500, 6: 1000, 7: 2000 };
  let disturbanceTotal = 0;
  let waterVaporTotal = 0;
  let isUpgrade = false;
  for (const card of drawResult) {
    const userCard = await ctx.database.get('gacha_user_card', { qq, card_id: card.card_id });
    if (!userCard.length) {
      await ctx.database.upsert('gacha_user_card', [{
        qq,
        card_id: card.card_id,
        card_level: 0,
        obtain_at: Date.now()
      }]);
      waterVaporTotal += INIT_WATER_VAPOR[card.card_star as keyof typeof INIT_WATER_VAPOR];
      ctx.logger.info(`[限时抽卡] ${showName}(${qq}) 卡池${code} 新增卡片：${card.card_id} ${card.card_name}，等级0`);
    } else {
      const currentLevel = userCard[0].card_level;
      if (currentLevel < CARD_LEVEL_MAX) {
        await ctx.database.upsert('gacha_user_card', [{
          id: userCard[0].id,
          qq,
          card_id: card.card_id,
          card_level: currentLevel + 1,
          obtain_at: Date.now()
        }]);
        isUpgrade = true;
        waterVaporTotal += UPGRADE_WATER_VAPOR[card.card_star as keyof typeof UPGRADE_WATER_VAPOR];
        ctx.logger.info(`[限时抽卡] ${showName}(${qq}) 卡池${code} 卡片升级：${card.card_id}，等级${currentLevel}→${currentLevel+1}`);
      } else {
        const d = STAR_TO_DISTURBANCE[card.card_star as keyof typeof STAR_TO_DISTURBANCE];
        if (d > 0) {
          disturbanceTotal += d;
          ctx.logger.info(`[限时抽卡] ${showName}(${qq}) 卡池${code} 卡片满级：${card.card_id}，转化为${d}热带扰动`);
        }
        // 0/1/2 星满级重复获得：发放水汽
        const v = MAXED_STAR_TO_VAPOR[card.card_star] || 0;
        if (v > 0) {
          waterVaporTotal += v;
          ctx.logger.info(`[限时抽卡] ${showName}(${qq}) 卡池${code} 卡片满级：${card.card_id}，转化为${v}水汽`);
        }
      }
    }
  }
  // 先算出本条指令要发多少条消息，再决定高星播报要不要带「风王出世」标题。
  // 固定开销：结算结果 1 条（水汽/扰动/保底进度/剩余抽数都拼在这条里）；超级幸运命中时 +1 条
  const luckyWillSend = luckyTotal.disturbance > 0 || luckyTotal.vapor > 0;
  const fixedCount = 1 + (luckyWillSend ? 1 : 0);
  let info = "";
if (isUpgrade) info += session.text("tip.draw.upgrade"); // 保留升级提示
// 🔥 核心修复：移除多余的 >=0 判断，直接拼接文案（数值本身不可能为负）
info += session.text("tip.draw.vapor", { vapor: waterVaporTotal + luckyTotal.vapor });
info += session.text("tip.draw.disturb", { disturbanceTotal: disturbanceTotal + luckyTotal.disturbance });
// 保底进度提示（剩余抽数兜底为 0，避免出现「再抽 -N 抽」）
if (!currentPity.hasGot) {
  const remaining = Math.max(0, threshold - newPityCount);
  info += session.text('tip.eventDraw.pityProgress', { star: limitStar, current: newPityCount, threshold, left: remaining });
} else {
  info += session.text('tip.eventDraw.pityReset', { star: limitStar });
}
// 新增：显示剩余限时抽数
info += "\n" + session.text('tip.eventDraw.left', { star: limitStar, left: have - count });
// 修复格式：移除末尾多余的分号
if (info) msg += "\n" + info.replace(/；$/, '');
  // 高星播报：按剩余可用条数自适应（完整 / 省标题 / 合并单条）
  await sendHighStarBroadcast(ctx, session, showName,
    highStarCards.map(c => ({ star: c.card_star, id: c.card_id, name: c.card_name })), fixedCount);
  await session.send(build_msg(session, msg));
  if (true) {
    const userAsset = await ctx.database.get('gacha_user_draw_count', { qq });
    await ctx.database.upsert('gacha_user_draw_count', [{
      qq,
      draw_count: userAsset[0]?.draw_count ?? 0,
      tropical_disturbance: (userAsset[0]?.tropical_disturbance ?? 0) + disturbanceTotal + luckyTotal.disturbance,
      water_vapor: (userAsset[0]?.water_vapor ?? 0) + waterVaporTotal + luckyTotal.vapor,
      no_6star_draws: userAsset[0]?.no_6star_draws ?? 0,
      no_7star_draws: userAsset[0]?.no_7star_draws ?? 0,
    }]);
    ctx.logger.info(`[限时抽卡] ${showName}(${qq}) 卡池${code} 累计更新：水汽+${waterVaporTotal}，热带扰动+${disturbanceTotal}，超级幸运：扰动+${luckyTotal.disturbance}、水汽+${luckyTotal.vapor}`);
  }
  await sendSuperLucky(ctx, session, luckyTotal);
}

// ==========================
// 扰动兑换 / 扰动抽卡
// 规则：每抽消耗热带扰动由配置项 disturbExchangePrice 决定（默认100）| 单次1-40抽
// 抽卡：范围为普通卡池，仅5/6/7星参与，概率 7星10%、6星36%、5星54%
// 水汽、扰动、卡片升级全部沿用既有规则，但抽卡不做高星特殊播报
// ==========================
async function _do_disturb_exchange(ctx: Context, session: Session, cnt: number, price: number) {
  const qq = await getUnifiedQQ(ctx, session);
  const realCnt = Math.min(Math.max(cnt | 0, 1), 40);
  const user = await ctx.database.get('gacha_user', { qq });
  if (!user.length) return await session.send(build_msg(session, session.text('error.common.notRegister')));

  const total = price * realCnt;
  const asset = await ctx.database.get('gacha_user_draw_count', { qq });
  const disturb = asset[0]?.tropical_disturbance ?? 0;
  if (disturb < total) {
    ctx.logger.warn(`[扰动兑换] 玩家${qq}兑换失败：热带扰动不足（拥有${disturb}，需${total}）`);
    return await session.send(build_msg(session, session.text('error.disturbExchange.disturb.notEnough', { need: total, have: disturb })));
  }

  // 扣减热带扰动 + 增加扰动抽数（记录到 gacha_user_disturb_draw）
  await ctx.database.upsert('gacha_user_draw_count', [{ qq, tropical_disturbance: disturb - total }]);
  const ud = await ctx.database.get('gacha_user_disturb_draw', { qq });
  const have = ud[0]?.draw_count ?? 0;
  await ctx.database.upsert('gacha_user_disturb_draw', [{ qq, draw_count: have + realCnt }]);
  ctx.logger.info(`[扰动兑换] 玩家${qq}兑换成功：获得${realCnt}抽，消耗扰动${total}，扰动抽数${have}→${have + realCnt}`);
  await session.send(build_msg(session,
    session.text('tip.disturbExchange.success', { count: realCnt, cost: total, left: have + realCnt })
  ));
}

async function _do_disturb_draw(ctx: Context, session: Session, count: number, luckyConfig: PluginConfig) {
  const qq = await getUnifiedQQ(ctx, session);
  const user = await ctx.database.get('gacha_user', { qq });
  if (!user.length) return await session.send(build_msg(session, session.text('error.common.notRegister')));
  const showName = user[0].status === 1 ? user[0].nickname : qq;
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    return await session.send(build_msg(session, session.text('error.draw.count.invalid')));
  }
  const ud = await ctx.database.get('gacha_user_disturb_draw', { qq });
  const have = ud[0]?.draw_count ?? 0;
  if (have < count) {
    return await session.send(build_msg(session, session.text('error.disturbDraw.count.notEnough', {
      need: count,
      have
    })));
  }

  // 普通卡池，仅5/6/7星参与抽卡
  const allCards = await ctx.database.get('gacha_card_pool', {});
  const starCardMap: Record<number, any[]> = { 5: [], 6: [], 7: [] };
  allCards.forEach(card => {
    if (starCardMap[card.card_star]) starCardMap[card.card_star].push(card);
  });
  // 概率：5/6/7星权重可配置（默认 5星54%、6星36%、7星10%）；某星级无卡时自动跳过该星级
  const disturbWeights = parseStarConfig(ctx, luckyConfig.disturbStarProbs, 3, [54, 36, 10], '扰动抽卡星级权重');
  const DISTURB_STAR_PROB = { 5: disturbWeights[0], 6: disturbWeights[1], 7: disturbWeights[2] };
  const weightedPool: number[] = [];
  for (const [star, prob] of Object.entries(DISTURB_STAR_PROB)) {
    if (!starCardMap[+star]?.length) continue;
    for (let i = 0; i < prob; i++) weightedPool.push(+star);
  }
  if (!weightedPool.length) {
    return await session.send(build_msg(session, session.text('error.draw.poolEmpty')));
  }

  const STAR_TO_DISTURBANCE = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 5, 5: 20, 6: 100, 7: 500 };
  const INIT_WATER_VAPOR = { 0: 50, 1: 100, 2: 150, 3: 200, 4: 500, 5: 1000, 6: 2000, 7: 5000 };
  const UPGRADE_WATER_VAPOR = { 0: 25, 1: 50, 2: 75, 3: 100, 4: 200, 5: 500, 6: 1000, 7: 2000 };

  const drawResult: any[] = [];
  let disturbanceTotal = 0;
  let waterVaporTotal = 0;
  let isUpgrade = false;
  const luckyTotal = { disturbance: 0, vapor: 0 };

  for (let i = 0; i < count; i++) {
    const selectedStar = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    const cardList = starCardMap[selectedStar];
    const card = cardList[Math.floor(Math.random() * cardList.length)];
    drawResult.push({ star: selectedStar, cid: card.card_id, name: card.card_name });

    // 卡片处理规则与普通抽卡/限时抽卡完全一致
    const userCard = await ctx.database.get('gacha_user_card', { qq, card_id: card.card_id });
    if (!userCard.length) {
      await ctx.database.upsert('gacha_user_card', [{
        qq,
        card_id: card.card_id,
        card_level: 0,
        obtain_at: Date.now()
      }]);
      waterVaporTotal += INIT_WATER_VAPOR[selectedStar as 0|1|2|3|4|5|6|7];
      ctx.logger.info(`[扰动抽卡] ${showName}(${qq}) 新增卡片：${card.card_id} ${card.card_name}，等级0`);
    } else {
      const currentLevel = userCard[0].card_level;
      if (currentLevel < CARD_LEVEL_MAX) {
        await ctx.database.upsert('gacha_user_card', [{
          id: userCard[0].id,
          qq,
          card_id: card.card_id,
          card_level: currentLevel + 1,
          obtain_at: Date.now()
        }]);
        isUpgrade = true;
        waterVaporTotal += UPGRADE_WATER_VAPOR[selectedStar as 0|1|2|3|4|5|6|7];
        ctx.logger.info(`[扰动抽卡] ${showName}(${qq}) 卡片升级：${card.card_id}，等级${currentLevel}→${currentLevel+1}`);
      } else {
        const d = STAR_TO_DISTURBANCE[selectedStar as 0|1|2|3|4|5|6|7];
        if (d > 0) {
          disturbanceTotal += d;
          ctx.logger.info(`[扰动抽卡] ${showName}(${qq}) 卡片满级：${card.card_id}，转化为${d}热带扰动`);
        }
      }
    }
    // ⚡ 超级幸运判定：每抽独立触发
    if (rollSuperLucky(luckyConfig, luckyTotal)) {
      ctx.logger.info(`[扰动抽卡] ${showName}(${qq}) 第${i + 1}抽触发超级幸运`);
    }
  }

  // 扣减扰动抽数
  await ctx.database.upsert('gacha_user_disturb_draw', [{ qq, draw_count: have - count }]);
  // 水汽/扰动正常发放（不改变普通抽数与普通池保底计数）
  const asset = await ctx.database.get('gacha_user_draw_count', { qq });
  await ctx.database.upsert('gacha_user_draw_count', [{
    qq,
    draw_count: asset[0]?.draw_count ?? 0,
    tropical_disturbance: (asset[0]?.tropical_disturbance ?? 0) + disturbanceTotal + luckyTotal.disturbance,
    water_vapor: (asset[0]?.water_vapor ?? 0) + waterVaporTotal + luckyTotal.vapor,
    no_6star_draws: asset[0]?.no_6star_draws ?? 0,
    no_7star_draws: asset[0]?.no_7star_draws ?? 0
  }]);
  ctx.logger.info(`[扰动抽卡] ${showName}(${qq}) 消耗${count}抽，剩余${have - count}，水汽+${waterVaporTotal}，热带扰动+${disturbanceTotal}，超级幸运：扰动+${luckyTotal.disturbance}、水汽+${luckyTotal.vapor}`);
  // 结果消息（不做高星特殊播报）
  let msg = session.text('tip.disturbDraw.title', { name: showName, left: have - count }) + "\n";
  drawResult.forEach(item => {
    msg += `${get_star_symbol(item.star)} ${item.cid} ${item.name}\n`;
  });
  let info = "";
  if (isUpgrade) info += session.text("tip.draw.upgrade");
  info += session.text("tip.draw.vapor", { vapor: waterVaporTotal + luckyTotal.vapor });
  info += session.text("tip.draw.disturb", { disturbanceTotal: disturbanceTotal + luckyTotal.disturbance });
  if (info) msg += "\n" + info.replace(/；$/, '');
  await session.send(build_msg(session, msg));
  await sendSuperLucky(ctx, session, luckyTotal);
}

// ==========================
// 5. 全群广播（完全按老代码格式修正）
// ==========================
async function _do_broadcast(
  ctx: Context,
  session: Session,
  msg: string,
  masterQQ: string
) {
  const userQQ = await getUnifiedQQ(ctx, session);
  if (userQQ !== masterQQ) {
    ctx.logger.warn(`非主人${userQQ}尝试执行全群广播，已拦截`);
    return await session.send(build_msg(session, session.text('error.common.noPermission')));
  }
  const groups = await ctx.database.get('gacha_group_switch', { status: 1 });
  let sent = 0;
  for (const g of groups) {
    try {
      await session.bot.sendMessage(g.group_id, build_msg(session, msg));
      sent++;
    } catch (e) {
      ctx.logger.error(`广播到群${g.group_id}失败：`, e);
    }
  }
  ctx.logger.info(`主人${masterQQ}执行全群广播，成功${sent}/${groups.length}个开启的群`);
  await session.send(build_msg(session, session.text('tip.broadcast.success', { count: sent })));
}
// ==========================
// WWC驳回 [QQ] —— 无报错最终版
// ==========================
async function _do_reject(ctx: Context, session: Session, rejectQQ: string, masterQQ: string) {
  // 仅主人可用
  const userQQ = await getUnifiedQQ(ctx, session);
if (userQQ !== masterQQ) {
    return await session.send(build_msg(session, '你没有权限执行驳回操作'));
  }

  // 查找用户
  const users = await ctx.database.get('gacha_user', { qq: rejectQQ });
  if (!users.length) {
    return await session.send(build_msg(session, `❌ QQ【${rejectQQ}】未注册`));
  }

  const user = users[0];
  let finalNick: string;

  // 已注册 → 驳回修改 → 恢复原昵称
  if (user.status === 1) {
    finalNick = user.nickname;
  }
  // 首次注册 → 驳回 → 显示QQ号
  else {
    finalNick = rejectQQ;
  }

  // ✅ 只写表里存在的字段，彻底不爆红
  await ctx.database.upsert('gacha_user', [{
    qq: rejectQQ,
    nickname: finalNick,
    status: 0,
    protect: user.protect
  }]);

  // 提示语
  if (user.status === 1) {
    await session.send(build_msg(session,
      `✅ 已驳回【${rejectQQ}】的昵称修改，恢复原昵称：${finalNick}`
    ));
  } else {
    await session.send(build_msg(session,
      `✅ 已驳回【${rejectQQ}】的昵称申请，将显示为QQ号`
    ));
  }
}
// ==========================
// 帮助指令：列出所有指令用法+示例
// ==========================
async function _do_help(ctx: Context, session: Session) {
  const helpMsg = session.text("command.wwc.help.title") + "\n" +
    session.text("command.wwc.help.register") + "\n" +
    session.text("command.wwc.help.sign") + "\n" +
    session.text("command.wwc.help.draw") + "\n" +
    session.text("command.wwc.help.warehouse") + "\n" +
    session.text("command.wwc.help.shop") + "\n" +
    session.text("command.wwc.help.upgrade") + "\n" +
    session.text("command.wwc.help.exchange") + "\n" +
    session.text("command.wwc.help.collection") + "\n" +
    session.text("command.wwc.help.ranking") + "\n" +
    session.text("command.wwc.help.eventStatus") + "\n" +
    session.text("command.wwc.help.eventDraw") + "\n" +
    session.text("command.wwc.help.eventExchange") + "\n" +
    session.text("command.wwc.help.disturbDraw") + "\n" +
    session.text("command.wwc.help.disturbExchange") + "\n" +
    session.text("command.wwc.help.tip");
  await session.send(build_msg(session, helpMsg));
}

// 插件入口
// 插件入口：完整修复 session 问题 + 补全建表逻辑
export async function apply(ctx: Context, config: PluginConfig) {
  ctx.i18n.define('zh-CN', zhCN);
  ctx.logger.info('插件启动成功 ✅')

  // ======== 补全完整建表逻辑（原代码省略导致数据库报错，核心修复）=======
  // 1. gacha_user（主键：qq）
ctx.model.extend('gacha_user', {
  qq: { type: 'string' },
  nickname: { type: 'string' },
  status: { type: 'integer' },
  protect: { type: 'integer' }
}, { primary: ['qq'] });

// 2. gacha_global_switch（主键：id）
ctx.model.extend('gacha_global_switch', {
  id: { type: 'integer' },
  status: { type: 'integer' }
}, { primary: ['id'] });

// 3. gacha_group_switch（主键：group_id）
ctx.model.extend('gacha_group_switch', {
  group_id: { type: 'string' },
  status: { type: 'integer' }
}, { primary: ['group_id'] });

// 4. gacha_sign_config（主键：id）
ctx.model.extend('gacha_sign_config', {
  id: { type: 'integer' },
  reset_hour: { type: 'integer' },
  reset_minute: { type: 'integer' }
}, { primary: ['id'] });

// 5. gacha_card_pool（主键：card_id）
ctx.model.extend('gacha_card_pool', {
  card_id: { type: 'string' },
  card_name: { type: 'string' },
  card_star: { type: 'integer' },
  category: { type: 'string' }
}, { primary: ['card_id'] });

// 6. gacha_user_draw_count（主键：qq）
ctx.model.extend('gacha_user_draw_count', {
  qq: { type: 'string' },
  draw_count: { type: 'integer' },
  tropical_disturbance: { type: 'integer' },
  water_vapor: { type: 'integer' },
  no_6star_draws: { type: 'integer' },
  no_7star_draws: { type: 'integer' }
}, { primary: ['qq'] });

// 7. gacha_user_sign（主键：qq）
ctx.model.extend('gacha_user_sign', {
  qq: { type: 'string' },
  last_sign_time: { type: 'string' }
}, { primary: ['qq'] });

// 8. gacha_user_card（主键：id，手动实现自增）
ctx.model.extend('gacha_user_card', {
  id: { type: 'integer' }, // 移除 autoIncrement: true
  qq: { type: 'string' },
  card_id: { type: 'string' },
  card_level: { type: 'integer' },
  obtain_at: { type: 'integer' }
}, { primary: ['id'] });

// 9. gacha_shop_daily（主键：id，手动实现自增）
ctx.model.extend('gacha_shop_daily', {
  id: { type: 'integer' }, // 移除 autoIncrement: true
  shop_date: { type: 'string' },
  card_id: { type: 'string' },
  card_star: { type: 'integer' },
  price: { type: 'integer' },
  server_bought: { type: 'integer' },
  server_limit: { type: 'integer' }
}, { primary: ['id'] });

// 10. gacha_shop_exchange（联合主键：qq + exchange_date）
ctx.model.extend('gacha_shop_exchange', {
  qq: { type: 'string' },
  exchange_date: { type: 'string' },
  exchange_count: { type: 'integer' }
}, { primary: ['qq', 'exchange_date'] });

ctx.model.extend('gacha_user_exchange', {
    qq: { type: 'string' },
    create_at: { type: 'integer' },
    count: { type: 'integer' }
  }, { primary: ['qq'] });
// 11. gacha_event_pool（联合主键：code + card_id）
ctx.model.extend('gacha_event_pool', {
  code: { type: 'string' },
  card_id: { type: 'string' },
  card_name: { type: 'string' },
  card_star: { type: 'integer' },
  card_type: { type: 'string' },
  start_at: { type: 'integer' },
  end_at: { type: 'integer' },
  created_at: { type: 'integer' }
}, { primary: ['code', 'card_id'] });

// 12. gacha_user_event_draw（主键：qq）
ctx.model.extend('gacha_user_event_draw', {
  qq: { type: 'string' },
  draw6: { type: 'integer' },
  draw7: { type: 'integer' }
}, { primary: ['qq'] });

// 13. gacha_user_event_pity（联合主键：qq + event_code）
ctx.model.extend('gacha_user_event_pity', {
  qq: { type: 'string' },
  event_code: { type: 'string' },
  pity6: { type: 'integer' },
  pity7: { type: 'integer' },
  got6: { type: 'boolean' },
  got7: { type: 'boolean' }
}, { primary: ['qq', 'event_code'] });

// 14. gacha_user_disturb_draw（主键：qq，记录扰动抽卡抽数）
ctx.model.extend('gacha_user_disturb_draw', {
  qq: { type: 'string' },
  draw_count: { type: 'integer' }
}, { primary: ['qq'] });
ctx.model.extend('gacha_group_member', {
  group_id: { type: 'string' },
  qq: { type: 'string' },
  group_nickname: { type: 'string' },
  card: { type: 'string' },
}, { primary: ['group_id', 'qq'] });
ctx.model.extend('user_platform_map', {
  platform: { type: 'string' },
  platform_user_id: { type: 'string' },
  qq: { type: 'string' }
}, { primary: ['platform', 'platform_user_id'] });
  // ======== 初始化默认数据（保留不变）=======
  await ctx.database.upsert('gacha_global_switch', [{ id: 1, status: 0 }])
  await ctx.database.upsert('gacha_sign_config', [{ id: 1, reset_hour: config.signResetHour, reset_minute: config.signResetMinute }])
  await ctx.database.get('gacha_user_sign', { qq: 'init' }).catch(() => {})

  // ======== 全局群聊消息计数器（保留不变，补全空逻辑）=======
  const groupMsgCounter = new Map<string, { count: number; lastValidMsg: { text: string; images: string[] } }>();
  ctx.on('message', async (session) => {
    // 保留原消息计数逻辑，无逻辑则留空，避免语法报错
    if (!session.guildId) return;
    const key = session.guildId;
    if (!groupMsgCounter.has(key)) {
      groupMsgCounter.set(key, { count: 0, lastValidMsg: { text: '', images: [] } });
    }
  });
  // ==========================
// 进群自动缓存群成员昵称（群名片+昵称）→ gacha_group_member
// ==========================
  ctx.on('guild-added', async (session) => {
    const guildId = session.guildId;
    if (!guildId) return;
    ctx.logger.info("[WWC] 群已加入，等待用户发言自动缓存昵称");
  });
  // 所有 Koishi 插件通用：稳定获取群名片，零报错
// 官方标准：发言自动缓存群昵称（零类型错误）
// 发言自动缓存群昵称（严格匹配官方 GuildMember 类型）
ctx.on('message', async (session) => {
  const guildId = session.guildId
  const userId = await getUnifiedQQ(ctx, session);
  if (!guildId || !userId) return

  try {
    // 官方唯一可用 API
    const member = await session.bot.getGuildMember(guildId, userId)

    // 官方字段：name = 群昵称
    const group_nickname = member.name || member.user?.username || userId
    const card = '' // 官方没有card字段，留空

    await ctx.database.upsert('gacha_group_member', [{
      group_id: guildId,
      qq: userId,
      group_nickname: group_nickname,
      card: card
    }]
    )
  } catch (err) {}
})
  // ==============================================
  // 核心重构：主流插件式指令注册（修复session描述问题，0报错）
  // 指令描述改用硬编码，避免根作用域调用session.text()
  // ==============================================
  // 1. 基础功能指令
  ctx.command('WWC注册 <昵称>', '注册/修改WWC账号，首次使用必须注册')
    .alias('wwc注册')
    .alias('WWC绑定')
    .action(async (argv, nickname) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_register(ctx, session, nickname, config.masterQQ);
    });

  ctx.command('WWC审核 [QQ]', '审核用户昵称，仅主人可用')
  .option('-a, --all', '通过所有待审核用户')
  .alias('wwc审核')
  .alias('WWC通过')
  .action(async (argv, qq) => {
    if (!argv.session) return;
    const session = argv.session;

    // 1. 尝试通过 argv.options 读取
    let isAll = !!(argv.options?.['all'] || argv.options?.['a'] || argv.options?.['-a'] || argv.options?.['--all'] || argv.options?.['-a, --all']);

    // 2. 如果仍为 false，使用原始消息内容兜底识别
    if (!isAll) {
      const raw = session.content || '';
      // 匹配 -a 或 --all（前后需有空白或位于开头/结尾）
      const hasAOption = /(?:^|\s)-a(?:\s|$)/.test(raw) || /(?:^|\s)--all(?:\s|$)/.test(raw);
      if (hasAOption) {
        isAll = true;
        ctx.logger.info('[WWC审核] 消息内容识别到 -a 或 --all');
      }
    }

    ctx.logger.info('[WWC审核] isAll=' + isAll + ', qq=' + qq);
    await _do_check(ctx, session, qq, config.masterQQ, isAll);
  });

  // 指令注册
ctx.command('WWC驳回 <QQ:string>', '驳回昵称申请，显示QQ或原昵称')
  .alias('wwc驳回')
  .action(async (argv, qq) => {
    if (!argv.session) return;
    await _do_reject(ctx, argv.session, qq, config.masterQQ);
  });

  ctx.command('WWC签到', '每日签到领取40抽，每日限1次')
    .alias('wwc签到')
    .alias('WWC每日签到')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_sign(ctx, session, config.signResetHour, config.signResetMinute);
    });

  ctx.command('WWC录入', '录入普通卡片信息，仅主人可用（每行：ID 名称 星级 类别）')
  .alias('wwc录入')
  .alias('WWC添加卡片')
  .action(async (argv) => {
    if (!argv.session) return;
    const session = argv.session;
    // 核心修复：安全获取 content，避免 undefined
    const content = session.content || '';
    const lines = content.split('\n').slice(1).map(l => l.trim()).filter(l => l);
    await _do_add_card(ctx, session, lines, config.masterQQ);
  });

  // 2. 抽卡核心指令
  ctx.command('WWC抽卡 [次数]', '普通抽卡，支持1-20连（默认1连，WWC十连=10次）')
  .alias('wwc抽卡')
  .alias('WWC单抽')
  .alias('WWC十连')
  .action(async (argv, count) => { // 移除默认值，统一在内部处理
    if (!argv.session) return;
    const session = argv.session;
    // 核心修复：先将参数转为数字，再做合法性校验
    const num = Number(count);
    // 校验逻辑：非数字/小于1/大于20 均默认1连
    const times = Number.isInteger(num) && num >= 1 && num <= 20 ? num : 1;
    await _do_draw(ctx, session, times, config.normalStar7Threshold, config.normalStar6Threshold, config.normalStar6Prob, config);
  });

  ctx.command('WWC仓库', '查看已拥有卡片，含等级/星级/限定标记，生成可视化图片')
    .alias('wwc仓库')
    .alias('WWC我的卡片')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_warehouse(ctx, session);
    });

  ctx.command('WWC店铺', '查看今日升格商店，显示热带扰动/水汽余额，生成可视化图片')
    .alias('wwc店铺')
    .alias('WWC商店')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_shop(ctx, session,config.signResetHour, config.signResetMinute);
    });

  ctx.command('WWC升格 <编号...>', '兑换店铺卡片，消耗热带扰动，支持多编号同时兑换')
    .alias('wwc升格')
    .alias('WWC兑换卡片')
    .action(async (argv, ...cardIds) => {
      if (!argv.session) return;
      const session = argv.session;
      const validIds = cardIds.filter(id => id.trim());
      await _do_upgrade(ctx, session, validIds, config.signResetHour, config.signResetMinute);
    });

  ctx.command('WWC兑换 <次数>', '水汽兑换普通抽数，100水汽=1抽，每日上限由配置决定，单次1-40')
  .alias('wwc兑换')
  .alias('WWC水汽兑换')
  .action(async (argv, count) => {
    if (!argv.session) return;
    const session = argv.session;
    const num = Number.isInteger(Number(count)) && Number(count) >= 1 && Number(count) <= 40 ? Number(count) : 1;
    await _do_exchange(ctx, session, num, config.dailyExchangeLimit, config.exchangeVaporPerDraw);
  });

  // 3. 收藏/排名指令（收藏图按类别拆分为三张，避免图片过长过大；保留原全量收藏图）
  // 分片分类规则来自配置项 collectionPart1Pattern / collectionPart2Pattern（正则），收藏3 = 两者都不匹配
  const collectionPatterns = compileCollectionPatterns(ctx, config.collectionPart1Pattern, config.collectionPart2Pattern);

  ctx.command('WWC收藏', '查看卡片收藏进度，含限定卡，生成可视化收藏图')
    .alias('wwc收藏')
    .alias('WWC收集进度')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_collection(ctx, session);
    });

  ctx.command('WWC收藏1', '查看卡片收藏进度1（分类正则见配置项 collectionPart1Pattern），含限定卡，生成可视化收藏图')
    .alias('wwc收藏1')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_collection(ctx, session, 1, collectionPatterns);
    });

  ctx.command('WWC收藏2', '查看卡片收藏进度2（分类正则见配置项 collectionPart2Pattern），含限定卡，生成可视化收藏图')
    .alias('wwc收藏2')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_collection(ctx, session, 2, collectionPatterns);
    });

  ctx.command('WWC收藏3', '查看卡片收藏进度3（不匹配收藏1/2正则的类别），含限定卡，生成可视化收藏图')
    .alias('wwc收藏3')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_collection(ctx, session, 3, collectionPatterns);
    });

  ctx.command('WWC排名1', '查看全服收藏排行，显示前20名+自身排名，生成可视化排行图')
    .alias('wwc排名1')
    .alias('WWC排行1')
    .alias('WWC榜单')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_ranking(ctx, session);
    });

  ctx.command('WWC排名2', '查看全服7/6星战力评分排行（7星0级20分每级+15，普通6星0级5分每级+3，限时6星0级8分每级+6），显示前20名+自身排名')
    .alias('wwc排名2')
    .alias('WWC排行2')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_ranking2(ctx, session);
    });

  // 4. 功能开关指令（仅主人可用）
  ctx.command('WWC开启', '开启本群WWC功能，仅主人可用')
    .alias('wwc开启')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_switch(ctx, session, 'group', 'open', config.masterQQ);
    });

  ctx.command('WWC关闭', '关闭本群WWC功能，仅主人可用')
    .alias('wwc关闭')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_switch(ctx, session, 'group', 'close', config.masterQQ);
    });

  ctx.command('WWC开启全部', '全局开启所有群WWC功能，仅主人可用')
    .alias('wwc开启全部')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_switch(ctx, session, 'global', 'open', config.masterQQ);
    });

  ctx.command('WWC关闭全部', '全局关闭所有群WWC功能，仅主人可用')
    .alias('wwc关闭全部')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_switch(ctx, session, 'global', 'close', config.masterQQ);
    });

  // 5. 限时卡池指令
  ctx.command('WWC限时状态', '查看当前开放的限时卡池，显示期数/卡片/开放时间')
    .alias('wwc限时状态')
    .alias('WWC限时卡池')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_event_status(ctx, session);
    });

  ctx.command('WWC限时抽卡 [期数] [次数]', '限时卡池抽卡，支持1-20连，无期限数匹配唯一开放池')
  .alias('wwc限时抽卡')
  .alias('WWC限抽')
  .action(async (argv, code?: string, count?: string) => { // 修复：count 声明为 string | undefined
    if (!argv.session) return;
    const session = argv.session;
    // 核心修复：将 count 转为数字，统一类型校验
    const num = Number(count);
    const times = Number.isInteger(num) && num >= 1 && num <= 20 ? num : 1;
    let data: number | string = times;
    if (code) data = `${code} ${times}`;
    await _do_event_draw(ctx, session, data, config.eventStar6Threshold, config.eventStar7Threshold, config);
  });

  ctx.command('WWC限时兑换 <期数> [次数]', '水汽兑换限时抽数，6星300/抽，7星450/抽，单次1-40')
  .alias('wwc限时兑换')
  .alias('WWC限时换抽')
  .action(async (argv, code: string, count?: string) => { // count声明为string | undefined，无数字默认值
    if (!argv.session || !code) return;
    const session = argv.session;
    // 核心修复：参数转数字+合法性校验，避免类型冲突
    const num = Number(count);
    const cnt = Number.isInteger(num) && num >= 1 && num <= 40 ? num : 1;
    await _do_event_exchange(ctx, session, { code, cnt }, config.eventExchangePrice6, config.eventExchangePrice7);
  });

  ctx.command('WWC扰动抽卡 [次数]', '使用扰动抽数抽卡（普通卡池：7星10%、6星36%、5星54%），支持1-20连')
  .alias('wwc扰动抽卡')
  .alias('WWC扰动抽')
  .action(async (argv, count?: string) => {
    if (!argv.session) return;
    const session = argv.session;
    const num = Number(count);
    const times = Number.isInteger(num) && num >= 1 && num <= 20 ? num : 1;
    await _do_disturb_draw(ctx, session, times, config);
  });

  ctx.command('WWC扰动兑换 <次数>', '热带扰动兑换扰动抽数，每抽消耗由配置项决定（默认100），单次1-40')
  .alias('wwc扰动兑换')
  .alias('WWC扰动换抽')
  .action(async (argv, count?: string) => {
    if (!argv.session) return;
    const session = argv.session;
    const num = Number(count);
    const cnt = Number.isInteger(num) && num >= 1 && num <= 40 ? num : 1;
    await _do_disturb_exchange(ctx, session, cnt, config.disturbExchangePrice);
  });

  ctx.command('WWC限时录入 <参数...>', '录入限时卡池信息，仅主人可用（格式：期数 ID 名称 星级 类别 开始戳 结束戳）')
    .alias('wwc限时录入')
    .action(async (argv, ...params) => {
      if (!argv.session) return;
      const session = argv.session;
      const data = params.join(' ').trim();
      await _do_event_add(ctx, session, data, config.masterQQ);
    });

  // 6. 主人专属指令
  ctx.command('WWC广播 <内容...>', '向所有开启WWC的群发送全群广播，仅主人可用')
    .alias('wwc广播')
    .alias('WWC全群通知')
    .action(async (argv, ...content) => {
      if (!argv.session) return;
      const session = argv.session;
      const msg = content.join(' ').trim();
      await _do_broadcast(ctx, session, msg, config.masterQQ);
    });
  // 7. 帮助指令
  ctx.command('WWChelp', '查看所有WWC指令的完整用法、示例和权限说明')
    .alias('wwchelp')
    .alias('WWC帮助')
    .action(async (argv) => {
      if (!argv.session) return;
      const session = argv.session;
      await _do_help(ctx, session);
    });

  ctx.command('WWC绑定QQ <qq:string>', '绑定你的QQ号（用于非数字ID平台）')
  .alias('wwc绑定qq')
  .action(async (argv, qq) => {
    const session = argv.session;
    if (!session) return;

    const userId = session.userId;
    const platform = session.platform;

    // 如果当前ID已是纯数字，说明是OneBot平台，无需绑定
    if (/^\d+$/.test(userId)) {
      return session.send('你的ID已经是QQ号，无需绑定。');
    }

    // 校验输入的QQ号是否合法（纯数字）
    if (!/^\d+$/.test(qq)) {
      return session.send('请输入正确的QQ号（纯数字）。');
    }

    // 1. 检查目标QQ是否已被其他用户绑定（忽略平台）
    const existingQQ = await ctx.database.get('user_platform_map', {
      qq: qq
    });
    if (existingQQ.length > 0) {
      // 如果绑定的用户不是当前用户，则驳回
      if (existingQQ[0].platform_user_id !== userId) {
        return session.send(`❌ 该QQ号 ${qq} 已被其他用户绑定，无法重复绑定。`);
      }
      // 如果是当前用户自己绑定的，允许继续（更新操作）
    }

    // 2. 检查当前用户是否已有绑定记录（同一platform和platform_user_id）
    const exist = await ctx.database.get('user_platform_map', {
      platform,
      platform_user_id: userId
    });
    if (exist.length) {
      // 更新绑定（覆盖为新的QQ）
      await ctx.database.upsert('user_platform_map', [{
        platform,
        platform_user_id: userId,
        qq
      }]);
      return session.send(`✅ 已更新绑定QQ号：${qq}`);
    }

    // 3. 新增绑定
    await ctx.database.create('user_platform_map', {
      platform,
      platform_user_id: userId,
      qq
    });
    session.send(`✅ 绑定成功！以后将使用QQ号 ${qq} 进行游戏。`);
  });

  // ======== 全局中间件（保留，用于开关校验，补全完整逻辑）=======
  ctx.middleware(async (session, next) => {
    const raw = session.content?.trim() || '';
    if (!raw.startsWith('WWC')) return next();
    // 跳过开关指令的校验，允许主人随时操作开关
    // 跳过绑定指令（允许用户执行绑定）
  if (raw.startsWith('WWC绑定QQ')) return next();

  const userId = session.userId;

  // 判断是否为纯数字（QQ号）
  const isNumeric = /^\d+$/.test(userId);
  let unifiedQQ: string | null = null;

  if (isNumeric) {
    // OneBot 场景：userId 本身就是 QQ 号
    unifiedQQ = userId;
  } else {
    // 其他平台（官方Bot等）：查映射表
    const records = await ctx.database.get('user_platform_map', {
      platform_user_id: userId
    });
    if (records.length) {
      unifiedQQ = records[0].qq;
    }
  }

  if (!unifiedQQ) {
    // 未绑定，发送提示并阻止执行
    await session.send(
      '检测到你尚未绑定QQ号，请私聊发送：\nWWC绑定QQ 你的QQ号'
    );
    return; // 不调用 next，拦截该消息
  }

  // 绑定成功，将统一QQ挂载到 session 上供后续使用
    const switchCmds = ['WWC开启', 'WWC关闭', 'WWC开启全部', 'WWC关闭全部'];
    if (switchCmds.some(cmd => raw.startsWith(cmd))) return next();
    // 全局开关校验
    const globalSwitch = await ctx.database.get('gacha_global_switch', { id: 1 });
    if (!globalSwitch.length || globalSwitch[0].status !== 1) return;
    // 群聊开关校验（私聊跳过）
    if (session.guildId && !session.channelId?.startsWith('private')) {
      const groupSwitch = await ctx.database.get('gacha_group_switch', { group_id: session.guildId });
      if (groupSwitch.length && groupSwitch[0].status !== 1) return;
    }
    return next();
  });

  console.log('✅ 习习抽卡系统（xxck-1）插件加载成功！')
}