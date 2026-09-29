"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGraphData = extractGraphData;
exports.extractSprintData = extractSprintData;
exports.extractAgentTrace = extractAgentTrace;
exports.extractIdeaToPrdData = extractIdeaToPrdData;
exports.extractCodeGraphData = extractCodeGraphData;
exports.extractFeatureGraphData = extractFeatureGraphData;
exports.extractEvolverData = extractEvolverData;
exports.autoRepairSprintStatus = autoRepairSprintStatus;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const source_of_truth_1 = require("./source-of-truth");
const yaml_1 = __importDefault(require("yaml"));
function extractGraphData(projectRoot) {
    const nodes = [];
    const edges = [];
    const epicsCandidates = [
        path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.4. epics-and-stories.md'),
        path.join(projectRoot, '_iwish-output', 'epics.md')
    ];
    const epicsFile = epicsCandidates.find(p => fs.existsSync(p));
    if (!epicsFile) {
        return { nodes, edges };
    }
    try {
        const content = fs.readFileSync(epicsFile, 'utf8');
        const lines = content.split('\n');
        let currentEpicId = null;
        // Add root Idea node
        nodes.push({
            id: 'root-idea',
            label: 'Core Idea / Product Vision',
            group: 'idea'
        });
        for (const line of lines) {
            // Matches: ## Epic 1: Antigravity 2.0 Adapter & Multi-Platform Shim
            const epicMatch = line.match(/^##\s+Epic\s+(\d+):\s*(.+)$/i);
            if (epicMatch) {
                const num = epicMatch[1];
                const title = epicMatch[2].trim();
                currentEpicId = `epic-${num}`;
                nodes.push({
                    id: currentEpicId,
                    label: `Epic ${num}: ${title}`,
                    group: 'epic'
                });
                edges.push({
                    from: 'root-idea',
                    to: currentEpicId,
                    type: 'spawns'
                });
                continue;
            }
            // Matches: ### Story 1.1: Platform Detection & Context Routing
            const storyMatch = line.match(/^###\s+Story\s+(\d+\.\d+):\s*(.+)$/i);
            if (storyMatch) {
                const num = storyMatch[1];
                const title = storyMatch[2].trim();
                const storyId = `story-${num}`;
                nodes.push({
                    id: storyId,
                    label: `Story ${num}: ${title}`,
                    group: 'story'
                });
                if (currentEpicId) {
                    edges.push({
                        from: currentEpicId,
                        to: storyId,
                        type: 'contains'
                    });
                }
            }
        }
    }
    catch (error) {
        console.warn('Error parsing epics file for graph data:', error);
        return { nodes: [], edges: [] };
    }
    return { nodes, edges };
}
function extractSprintData(projectRoot) {
    try {
        const truth = (0, source_of_truth_1.loadSourceOfTruth)(projectRoot);
        return truth.storyRecords.map(record => {
            let content = '';
            if (record.path) {
                const absolutePath = path.join(projectRoot, record.path);
                if (fs.existsSync(absolutePath)) {
                    content = fs.readFileSync(absolutePath, 'utf8');
                }
            }
            return {
                id: record.id,
                epicId: record.epicId,
                title: record.title,
                path: record.path,
                status: record.sprintStatus || record.fileStatus || 'backlog',
                readiness: record.readiness,
                hasAcceptanceCriteria: record.hasAcceptanceCriteria,
                hasTaskBreakdown: record.hasTaskBreakdown,
                content,
                uiSpecContent: record.uiSpecContent,
                dataSpecContent: record.dataSpecContent
            };
        });
    }
    catch (error) {
        console.warn('Error extracting sprint data:', error);
        const fallback = [];
        return fallback;
    }
}
function extractAgentTrace(projectRoot) {
    const tracePath = path.join(projectRoot, '.iwish', 'runtime', 'workflows', 'agent-trace.json');
    if (fs.existsSync(tracePath)) {
        try {
            return fs.readJsonSync(tracePath);
        }
        catch (e) {
            console.warn('Error reading agent-trace.json:', e);
        }
    }
    const fallbackTrace = [];
    return fallbackTrace;
}
function parseMarkdownFile(filePath, fallbackSummary) {
    try {
        if (!fs.existsSync(filePath)) {
            return { title: '', summary: fallbackSummary, extra: {} };
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let title = '';
        const summary = [];
        const extra = {};
        // Basic frontmatter extraction
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const fmLines = frontmatterMatch[1].split('\n');
            for (const line of fmLines) {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
                    extra[key] = value;
                }
            }
        }
        for (let line of lines) {
            line = line.trim();
            if (!title) {
                const hMatch = line.match(/^#\s+(.+)$/);
                if (hMatch) {
                    title = hMatch[1].trim();
                    continue;
                }
                const h2Match = line.match(/^##\s+(.+)$/);
                if (h2Match) {
                    title = h2Match[1].trim();
                    continue;
                }
            }
            // Extract bullet lists (skip lists in frontmatter)
            if (!frontmatterMatch || !content.substring(0, frontmatterMatch[0].length).includes(line)) {
                const listMatch = line.match(/^[-*+]\s+(.+)$/);
                if (listMatch && summary.length < 5) {
                    const text = listMatch[1].trim().replace(/[*_`]/g, '');
                    if (text && !text.includes('title:') && !text.includes('type:') && !text.includes('phase:')) {
                        summary.push(text);
                    }
                }
            }
        }
        if (extra.title && !title) {
            title = extra.title;
        }
        return {
            title: title || path.basename(filePath, '.md'),
            summary: summary.length > 0 ? summary : fallbackSummary,
            extra
        };
    }
    catch (err) {
        console.warn(`Error parsing markdown file ${filePath}:`, err);
        return { title: '', summary: fallbackSummary, extra: {} };
    }
}
function extractIdeaToPrdData(projectRoot) {
    const slides = [];
    // Try to determine project details from manifest
    let projectName = path.basename(projectRoot);
    let projectType = 'commercial-product';
    const manifestPath = path.join(projectRoot, '.iwish', 'runtime', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        try {
            const manifest = fs.readJsonSync(manifestPath);
            if (manifest.product)
                projectName = manifest.product;
        }
        catch (e) { }
    }
    // Find dynamic idea challenges folder
    let ideaChallengeDistillatePath = null;
    let bizStackPath = null;
    const ideaChallengesDirs = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', 'idea-challenges'),
        path.join(projectRoot, '_iwish-output', 'planning', 'idea-challenges'),
        path.join(projectRoot, '_bmad-output', 'planning', 'idea-challenges'),
    ];
    const ideaChallengesDir = ideaChallengesDirs.find(d => fs.existsSync(d)) || ideaChallengesDirs[0];
    if (fs.existsSync(ideaChallengesDir)) {
        try {
            const subs = fs.readdirSync(ideaChallengesDir);
            for (const sub of subs) {
                const subPath = path.join(ideaChallengesDir, sub);
                if (fs.statSync(subPath).isDirectory()) {
                    const distillate = fs.readdirSync(subPath).find(f => f.includes('distillate.md'));
                    if (distillate) {
                        ideaChallengeDistillatePath = path.join(subPath, distillate);
                    }
                    const bizStack = fs.readdirSync(subPath).find(f => f.includes('biz-stack.md'));
                    if (bizStack) {
                        bizStackPath = path.join(subPath, bizStack);
                    }
                }
            }
        }
        catch (e) { }
    }
    // 0. Idea Discovery
    const discoverCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.1. idea-discovery.md'),
        path.join(projectRoot, 'docs', 'idea-discovery.md')
    ];
    let discoverPath = discoverCandidates.find(p => fs.existsSync(p)) || null;
    const discoverInfo = discoverPath
        ? parseMarkdownFile(discoverPath, ['Làm rõ ý tưởng thô ban đầu', 'Mom Test & JTBD validation', 'Xác định bối cảnh và nỗi đau người dùng'])
        : { title: 'Làm rõ Ý tưởng (Idea Discovery)', summary: ['Sử dụng bộ khung 5 thấu kính để phỏng vấn khách hàng.', 'Áp dụng Mom Test & JTBD loại bỏ các giả định mơ hồ.', 'Thiết lập tiền đề và nỗi đau cốt lõi trước khi brainstorm.'], extra: {} };
    slides.push({
        id: 'idea-discover',
        title: discoverInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: discoverPath ? path.relative(projectRoot, discoverPath) : null,
        exists: discoverPath !== null,
        summary: discoverInfo.summary,
        causality: 'Xác định chính xác nỗi đau và đối tượng mục tiêu, làm gốc rễ cho toàn bộ các bước tiếp theo.',
        inputs: ['Ý tưởng thô ban đầu / Đề xuất thô từ người dùng'],
        outputs: ['Tài liệu idea-discovery.md (Mom Test & JTBD)'],
        visualType: 'mindmap',
        status: discoverPath ? 'completed' : 'pending',
        extra: discoverInfo.extra
    });
    // 1. Brainstorming
    const brainstormCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.2. idea-bank.md'),
        path.join(projectRoot, 'docs', 'brainstorm.md'),
        path.join(projectRoot, 'docs', 'brainstorming.md')
    ];
    let brainstormPath = brainstormCandidates.find(p => fs.existsSync(p)) || null;
    const brainstormInfo = brainstormPath
        ? parseMarkdownFile(brainstormPath, ['Xác định ý tưởng sản phẩm ban đầu', 'Đánh giá tính khả thi sơ bộ', 'Phân tích các cơ hội giải quyết nỗi đau của khách hàng'])
        : { title: 'Brainstorming & Sàng lọc Ý tưởng', summary: ['Khởi động và động não các ý tưởng cốt lõi của sản phẩm.', 'Đánh giá sơ bộ và triage ý tưởng theo mức độ phức tạp Complexity Score.', 'Tạo nền tảng định hướng giá trị ban đầu cho dự án.'], extra: {} };
    slides.push({
        id: 'brainstorm',
        title: brainstormInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: brainstormPath ? path.relative(projectRoot, brainstormPath) : null,
        exists: brainstormPath !== null,
        summary: brainstormInfo.summary,
        causality: 'Xác định rõ ràng nỗi đau thị trường cốt lõi và khoanh vùng các giải pháp khả thi nhất trước khi đi sâu.',
        inputs: ['Ý kiến từ khách hàng / Khảo sát thị trường', 'Đề xuất từ Stakeholders'],
        outputs: ['Định hướng ý tưởng cốt lõi', 'Đánh giá Complexity Score (CS)'],
        visualType: 'mindmap',
        status: brainstormPath ? 'completed' : 'pending',
        extra: brainstormInfo.extra
    });
    // 2. Idea Challenge
    const challengeCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.3. idea-challenge.md'),
        path.join(projectRoot, 'docs', 'idea-challenge.md')
    ];
    const challengePath = ideaChallengeDistillatePath || challengeCandidates.find(p => fs.existsSync(p)) || null;
    const challengeExists = challengePath !== null && fs.existsSync(challengePath);
    const challengeInfo = challengeExists
        ? parseMarkdownFile(challengePath, ['Working Backwards distillate', 'Thông cáo báo chí (Press Release)', 'Câu hỏi thường gặp từ khách hàng (Customer FAQ)'])
        : { title: 'Working Backwards (Idea Challenge)', summary: ['Thách thức ý tưởng bằng phương pháp Working Backwards của Amazon.', 'Tập trung viết Press Release và Customer FAQ giả tưởng để thấu hiểu khách hàng.', 'Lọc ra các giá trị cốt lõi và bỏ qua các tính năng không thiết thực.'], extra: {} };
    slides.push({
        id: 'idea-challenge',
        title: challengeInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: challengeExists ? path.relative(projectRoot, challengePath) : null,
        exists: challengeExists,
        summary: challengeInfo.summary,
        causality: 'Ép buộc đội ngũ tư duy ngược từ kết quả mong đợi của khách hàng, tránh phát triển các tính năng dư thừa (YAGNI).',
        inputs: ['Định hướng ý tưởng cốt lõi từ Brainstorm'],
        outputs: ['Tài liệu PRFAQ Distillate', 'Press Release & Customer FAQ'],
        visualType: 'prfaq',
        status: challengeExists ? 'completed' : 'pending',
        extra: challengeInfo.extra
    });
    // 3. Moat Challenge
    const moatCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.3. idea-challenge.md'),
        path.join(projectRoot, 'docs', 'biz-stack.md')
    ];
    const moatFile = bizStackPath || moatCandidates.find(p => fs.existsSync(p)) || null;
    const moatExists = moatFile !== null && fs.existsSync(moatFile);
    const moatInfo = moatExists
        ? parseMarkdownFile(moatFile, ['Core advantage source', 'Business model evaluation', 'Pricing logic & locking factors'])
        : { title: 'Moat Challenge & Lợi thế Cạnh tranh', summary: ['Đánh giá các rào cản phòng thủ kinh doanh (Economic Moats) của sản phẩm.', 'Định hình mô hình kinh doanh (Business Model) và logic định giá.', 'Phân tích các yếu tố khóa chân khách hàng (Lock-in) và rủi ro xói mòn lợi thế.'], extra: {} };
    slides.push({
        id: 'moat-challenge',
        title: moatInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: moatExists ? path.relative(projectRoot, moatFile) : null,
        exists: moatExists,
        summary: moatInfo.summary,
        causality: 'Thiết lập các lợi thế cạnh tranh bền vững để bảo vệ sản phẩm trước các đối thủ cạnh tranh trên thị trường lâu dài.',
        inputs: ['PRFAQ Distillate', 'Đặc tả giá trị cốt lõi'],
        outputs: ['Biz Stack Blueprint', 'Economic Moats Scorecard'],
        visualType: 'moat',
        status: moatExists ? 'completed' : 'pending',
        extra: moatInfo.extra
    });
    // 4a. Market Research
    const marketCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.4. research', 'market-research.md'),
        path.join(projectRoot, 'docs', 'market-research.md'),
        path.join(projectRoot, 'docs', 'market_research.md'),
        path.join(projectRoot, 'market-research.md')
    ];
    let marketPath = marketCandidates.find(p => fs.existsSync(p)) || null;
    const marketInfo = marketPath
        ? parseMarkdownFile(marketPath, ['Khảo sát quy mô thị trường & CAGR', 'Xác định khách hàng mục tiêu', 'Đánh giá các kênh tiếp cận chính'])
        : { title: 'Market Research (Nghiên cứu Thị trường)', summary: ['Nghiên cứu quy mô và cơ hội của thị trường mục tiêu.', 'Xác định chân dung khách hàng và nhu cầu chưa được đáp ứng.', 'Đánh giá tính khả thi kinh doanh của sản phẩm.'], extra: {} };
    slides.push({
        id: 'market-research',
        title: marketInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: marketPath ? path.relative(projectRoot, marketPath) : null,
        exists: marketPath !== null,
        summary: marketInfo.summary,
        causality: 'Xác minh quy mô thị trường và nhu cầu của khách hàng trước khi quyết định đầu tư nguồn lực phát triển.',
        inputs: ['Ý tưởng sơ bộ', 'Moat Challenge / Lợi thế kinh doanh'],
        outputs: ['Báo cáo Nghiên cứu Thị trường (Market Research)'],
        visualType: 'market-research',
        status: marketPath ? 'completed' : 'pending',
        extra: marketInfo.extra
    });
    // 4b. Competitor Research
    const competitorCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.4. research', 'competitor-research.md'),
        path.join(projectRoot, 'docs', 'competitor-research.md'),
        path.join(projectRoot, 'docs', 'competitor_research.md')
    ];
    let competitorPath = competitorCandidates.find(p => fs.existsSync(p)) || null;
    if (!competitorPath) {
        try {
            const docsDir = path.join(projectRoot, 'docs');
            if (fs.existsSync(docsDir)) {
                const matches = fs.readdirSync(docsDir).filter(f => f.includes('competitor') && f.endsWith('.md'));
                if (matches.length > 0)
                    competitorPath = path.join(docsDir, matches[0]);
            }
        }
        catch (e) { }
    }
    const competitorInfo = competitorPath
        ? parseMarkdownFile(competitorPath, ['Phân tích tính năng & trải nghiệm đối thủ', 'Thiết lập Gap Matrix', 'Xác định các Attack Vectors cạnh tranh'])
        : { title: 'Competitor Research (Nghiên cứu Đối thủ)', summary: ['Liệt kê và phân tích các đối thủ cạnh tranh trực tiếp và gián tiếp.', 'Thiết lập ma trận khoảng trống tính năng (Gap Matrix).', 'Đề xuất các hướng tấn công công nghệ và kinh doanh (Attack Vectors).'], extra: {} };
    slides.push({
        id: 'competitor-research',
        title: competitorInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: competitorPath ? path.relative(projectRoot, competitorPath) : null,
        exists: competitorPath !== null,
        summary: competitorInfo.summary,
        causality: 'Hiểu rõ điểm mạnh/yếu của đối thủ để né tránh cạnh tranh trực diện và định hình tính năng khác biệt.',
        inputs: ['Market Research', 'Danh sách đối thủ cạnh tranh'],
        outputs: ['Ma trận khoảng trống (Gap Matrix)', 'Định hướng tính năng độc quyền'],
        visualType: 'competitor-research',
        status: competitorPath ? 'completed' : 'pending',
        extra: competitorInfo.extra
    });
    // 4c. Domain Research
    const domainCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.4. research', 'domain-research.md'),
        path.join(projectRoot, 'docs', 'domain-research.md'),
        path.join(projectRoot, 'docs', 'domain_research.md'),
        path.join(projectRoot, 'domain-research.md')
    ];
    let domainPath = domainCandidates.find(p => fs.existsSync(p)) || null;
    const domainInfo = domainPath
        ? parseMarkdownFile(domainPath, ['Làm rõ quy chuẩn và thuật ngữ nghiệp vụ', 'Xác định các luật lệ chính phủ & tuân thủ pháp lý', 'Lập mô hình thông tin nghiệp vụ chính'])
        : { title: 'Domain Research (Nghiên cứu Nghiệp vụ)', summary: ['Nghiên cứu sâu các quy tắc nghiệp vụ và chuẩn mực của lĩnh vực kinh doanh.', 'Phân tích các ràng buộc về mặt pháp lý hoặc quy định của chính phủ.', 'Xây dựng bảng thuật ngữ chuẩn (Glossary) để đồng bộ thuật ngữ.'], extra: {} };
    slides.push({
        id: 'domain-research',
        title: domainInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: domainPath ? path.relative(projectRoot, domainPath) : null,
        exists: domainPath !== null,
        summary: domainInfo.summary,
        causality: 'Đảm bảo logic nghiệp vụ của sản phẩm tuân thủ các quy định bắt buộc và đúng bản chất thuật ngữ chuyên ngành.',
        inputs: ['PRFAQ Distillate', 'Tài liệu tiêu chuẩn ngành'],
        outputs: ['Bản đồ nghiệp vụ (Domain Model)', 'Bảng thuật ngữ Glossary'],
        visualType: 'domain-research',
        status: domainPath ? 'completed' : 'pending',
        extra: domainInfo.extra
    });
    // 4d. Technical Research
    const techCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.4. research', 'technical-research.md'),
        path.join(projectRoot, 'docs', 'technical-research.md'),
        path.join(projectRoot, 'docs', 'technical_research.md'),
        path.join(projectRoot, 'docs', 'research_notes.md'),
        path.join(projectRoot, 'docs', 'research-notes.md'),
        path.join(projectRoot, 'research_notes.md')
    ];
    let techPath = techCandidates.find(p => fs.existsSync(p)) || null;
    if (!techPath) {
        try {
            const openModsDir = path.join(projectRoot, 'docs', 'open-modules');
            if (fs.existsSync(openModsDir)) {
                const matches = fs.readdirSync(openModsDir).filter(f => f.includes('research') && f.endsWith('.md'));
                if (matches.length > 0)
                    techPath = path.join(openModsDir, matches[0]);
            }
        }
        catch (e) { }
    }
    const techInfo = techPath
        ? parseMarkdownFile(techPath, ['Đánh giá các thư viện và framework ứng dụng', 'Xây dựng thử nghiệm Proof of Concept (PoC)', 'Phân tích hiệu năng & tính bảo mật kỹ thuật'])
        : { title: 'Technical Research (Nghiên cứu Kỹ thuật)', summary: ['Nghiên cứu tính khả thi về mặt kỹ thuật của các giải pháp cốt lõi.', 'Đánh giá so sánh các thư viện, dịch vụ và kiến trúc kỹ thuật.', 'Thực hiện các thử nghiệm nhỏ (PoC) để kiểm chứng giả thuyết.'], extra: {} };
    slides.push({
        id: 'technical-research',
        title: techInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: techPath ? path.relative(projectRoot, techPath) : null,
        exists: techPath !== null,
        summary: techInfo.summary,
        causality: 'Loại bỏ rủi ro về mặt công nghệ, chọn đúng thư viện/framework từ sớm để tránh đập đi xây lại sau này.',
        inputs: ['Câu hỏi kiến trúc kỹ thuật', 'Yêu cầu chức năng sơ bộ'],
        outputs: ['Tech Stack Quyết định', 'Thử nghiệm khả thi PoC Report'],
        visualType: 'technical-research',
        status: techPath ? 'completed' : 'pending',
        extra: techInfo.extra
    });
    // 5. Project Context
    const contextCandidates = [
        path.join(projectRoot, '_iwish-output', '1. Idea Discovery', '1.4. research', 'project-context.md'),
        path.join(projectRoot, 'project-context.md'),
        path.join(projectRoot, '.agent', 'project-context.md')
    ];
    const contextPath = contextCandidates.find(p => fs.existsSync(p)) || null;
    const contextInfo = contextPath
        ? parseMarkdownFile(contextPath, ['Codebase conventions', 'Bối cảnh phát triển', 'Các ràng buộc cấu trúc và chỉ thị của AI Agent'])
        : { title: 'Project Context & Quy tắc Lập trình', summary: ['Xác định các quy tắc cốt lõi giúp các AI Agent hiểu bối cảnh dự án.', 'Quy chuẩn cấu trúc thư mục, kiến trúc mã nguồn và các design patterns.', 'Thiết lập các ràng buộc biên dịch và kiểm thử tự động.'], extra: {} };
    slides.push({
        id: 'project-context',
        title: contextInfo.title,
        phase: 'Phase 1: Concept & Grounding',
        path: contextPath ? path.relative(projectRoot, contextPath) : null,
        exists: contextPath !== null,
        summary: contextInfo.summary,
        causality: 'Đảm bảo sự đồng bộ tuyệt đối về coding conventions và kiến trúc hệ thống giữa con người và tất cả các AI agent tự động.',
        inputs: ['Kiến trúc mong muốn', 'Quy tắc tổ chức của I-Wish'],
        outputs: ['File project-context.md tối ưu bối cảnh agent'],
        visualType: 'context',
        status: contextPath ? 'completed' : 'pending',
        extra: contextInfo.extra
    });
    // 6. PRD
    const prdCandidates = [
        path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.1. product-brief-or-prd.md'),
        path.join(projectRoot, 'docs', 'PRD.md'),
        path.join(projectRoot, 'docs', 'prd.md'),
        path.join(projectRoot, 'PRD.md')
    ];
    let prdPath = prdCandidates.find(p => fs.existsSync(p)) || null;
    if (!prdPath) {
        // Search in iwish-skills
        try {
            const skillsDir = path.join(projectRoot, '_iwish-output', 'iwish-skills');
            if (fs.existsSync(skillsDir)) {
                const match = fs.readdirSync(skillsDir).find(f => f.startsWith('prd-') && f.endsWith('.md'));
                if (match)
                    prdPath = path.join(skillsDir, match);
            }
        }
        catch (e) { }
    }
    const prdInfo = prdPath
        ? parseMarkdownFile(prdPath, ['Yêu cầu chức năng (Functional Requirements)', 'Yêu cầu phi chức năng (Non-Functional Requirements)', 'Chỉ số đo lường thành công (Success Metrics)'])
        : { title: 'Product Requirements Document (PRD)', summary: ['Đặc tả chi tiết các yêu cầu chức năng SMART.', 'Thiết lập các yêu cầu phi chức năng (hiệu năng, bảo mật, a11y).', 'Xác định các chỉ số thành công đo lường được (Success Metrics).'], extra: {} };
    slides.push({
        id: 'prd',
        title: prdInfo.title,
        phase: 'Phase 2: Product & UX Specs',
        path: prdPath ? path.relative(projectRoot, prdPath) : null,
        exists: prdPath !== null,
        summary: prdInfo.summary,
        causality: 'Cung cấp "Nguồn Sự Thật" (Source of Truth) duy nhất về mặt nghiệp vụ để đội ngũ và các agent phát triển đúng yêu cầu kinh doanh.',
        inputs: ['PRFAQ Distillate', 'Biz Stack', 'Research Notes', 'Project Context'],
        outputs: ['Đặc tả yêu cầu sản phẩm PRD.md', 'KPIs / Success Metrics'],
        visualType: 'prd',
        status: prdPath ? 'completed' : 'pending',
        extra: prdInfo.extra
    });
    // 7. UX Design
    const uxCandidates = [
        path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.3. ui-ux-spec.md'),
        path.join(projectRoot, 'docs', 'ux_spec.md'),
        path.join(projectRoot, 'docs', 'design.md'),
        path.join(projectRoot, 'docs', 'ui-ux-integration', 'implementation-plan.md')
    ];
    const uxPath = uxCandidates.find(p => fs.existsSync(p)) || null;
    const uxInfo = uxPath
        ? parseMarkdownFile(uxPath, ['User journeys mapping', 'Design tokens & components structure', 'UX validation checklist'])
        : { title: 'UX Design & Trải nghiệm Người dùng', summary: ['Xây dựng bản đồ hành trình người dùng (User Journeys) trực quan.', 'Đặc tả Design Tokens và cấu trúc các component giao diện.', 'Thiết lập chốt kiểm soát visual-fidelity-gate chống lệch giao diện.'], extra: {} };
    slides.push({
        id: 'ux-design',
        title: uxInfo.title,
        phase: 'Phase 2: Product & UX Specs',
        path: uxPath ? path.relative(projectRoot, uxPath) : null,
        exists: uxPath !== null,
        summary: uxInfo.summary,
        causality: 'Đảm bảo giao diện trực quan, luồng đi của người dùng mượt mà và không bị sai lệch thiết kế (visual regressions) qua các sprint.',
        inputs: ['PRD Chức năng (Functional Requirements)', 'Phân loại Persona người dùng'],
        outputs: ['UX Specification / User Journeys', 'Stitch Design Tokens (DESIGN.md)'],
        visualType: 'ux',
        status: uxPath ? 'completed' : 'pending',
        extra: uxInfo.extra
    });
    // 8. Architecture
    const archCandidates = [
        path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.2. database-spec.md'),
        path.join(projectRoot, 'docs', 'architecture.md'),
        path.join(projectRoot, 'docs', 'decisions', 'ADR-001-data-workflow-architecture.md')
    ];
    let archPath = archCandidates.find(p => fs.existsSync(p)) || null;
    if (!archPath) {
        try {
            const skillsDir = path.join(projectRoot, '_iwish-output', 'iwish-skills');
            if (fs.existsSync(skillsDir)) {
                const match = fs.readdirSync(skillsDir).find(f => f.startsWith('architecture-') && f.endsWith('.md'));
                if (match)
                    archPath = path.join(skillsDir, match);
            }
        }
        catch (e) { }
    }
    const archInfo = archPath
        ? parseMarkdownFile(archPath, ['Tài liệu quyết định thiết kế kiến trúc (ADR)', 'Lược đồ cơ sở dữ liệu (Database Schema / ERD)', 'Hợp đồng API (API Contracts)', 'Kiến trúc phân tầng dự án'])
        : { title: 'Architecture Design (ADR & ERD)', summary: ['Thiết kế kiến trúc hệ thống tổng thể và các modul thành phần.', 'Xây dựng sơ đồ thực thể dữ liệu (ERD) và hợp đồng kết nối API.', 'Lập các tài liệu quyết định kiến trúc ADR để tránh xung đột cấu trúc.'], extra: {} };
    slides.push({
        id: 'architecture',
        title: archInfo.title,
        phase: 'Phase 3: Solution & Backlog',
        path: archPath ? path.relative(projectRoot, archPath) : null,
        exists: archPath !== null,
        summary: archInfo.summary,
        causality: 'Lập bản vẽ kỹ thuật chi tiết để hệ thống hoạt động ổn định, mở rộng được và hạn chế tối đa nợ kỹ thuật (Technical Debt).',
        inputs: ['PRD đặc tả yêu cầu', 'UX Design Tokens & Giao diện', 'Project Context'],
        outputs: ['Quyết định kiến trúc ADR', 'Sơ đồ ERD & API Contract Specs'],
        visualType: 'architecture',
        status: archPath ? 'completed' : 'pending',
        extra: archInfo.extra
    });
    // 9. Epics & Stories
    const epicsCandidates = [
        path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.4. epics-and-stories.md'),
        path.join(projectRoot, 'docs', 'epics_list.md'),
        path.join(projectRoot, '_iwish-output', 'epics.md'),
        path.join(projectRoot, 'docs', 'ui-ux-integration', 'epics.md')
    ];
    let epicsPath = epicsCandidates.find(p => fs.existsSync(p)) || null;
    if (!epicsPath) {
        try {
            const skillsDir = path.join(projectRoot, '_iwish-output', 'iwish-skills');
            if (fs.existsSync(skillsDir)) {
                const match = fs.readdirSync(skillsDir).find(f => f.startsWith('epics-') && f.endsWith('.md'));
                if (match)
                    epicsPath = path.join(skillsDir, match);
            }
        }
        catch (e) { }
    }
    const epicsInfo = epicsPath
        ? parseMarkdownFile(epicsPath, ['Danh sách Epics lớn của dự án', 'Phân rã thành các User Story chi tiết', ' Acceptance Criteria cho từng câu chuyện'])
        : { title: 'Epics & Stories Backlog', summary: ['Phân rã PRD và Kiến trúc thành các Epic lớn định hướng giá trị.', 'Tạo các câu chuyện người dùng (User Story) kèm Acceptance Criteria rõ ràng.', 'Khởi tạo cấu hình chạy Sprint tự động (sprint-status.yaml).'], extra: {} };
    slides.push({
        id: 'epics-stories',
        title: epicsInfo.title,
        phase: 'Phase 3: Solution & Backlog',
        path: epicsPath ? path.relative(projectRoot, epicsPath) : null,
        exists: epicsPath !== null,
        summary: epicsInfo.summary,
        causality: 'Tách biệt các phần việc lớn thành các story độc lập, tạo ra backlog triển khai rõ ràng cho dev-agent chạy Sprint Agile.',
        inputs: ['Architecture design ADR', 'PRD Requirements'],
        outputs: ['docs/epics_list.md backlog', 'sprint-status.yaml cấu hình'],
        visualType: 'backlog',
        status: epicsPath ? 'completed' : 'pending',
        extra: epicsInfo.extra
    });
    return {
        projectName,
        projectType,
        slides
    };
}
function extractCodeGraphData(projectRoot) {
    const codeGraphPath = path.join(projectRoot, '.iwish', 'cache', 'iwish-code-graph.json');
    if (!fs.existsSync(codeGraphPath)) {
        return null;
    }
    try {
        const data = fs.readJsonSync(codeGraphPath);
        if (!data.nodes || !data.edges) {
            console.warn('Code graph JSON exists but has invalid structure.');
            return null;
        }
        return data;
    }
    catch (error) {
        console.warn('Error reading code graph JSON:', error);
        return null;
    }
}
function extractFeatureGraphData(projectRoot) {
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    // Pre-load Epics
    const epicsCandidates = [
        path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.4. epics-and-stories.md'),
        path.join(projectRoot, '_iwish-output', 'epics.md')
    ];
    const epicsPath = epicsCandidates.find(p => fs.existsSync(p));
    if (epicsPath) {
        const epicsContent = fs.readFileSync(epicsPath, 'utf8');
        const lines = epicsContent.split('\n');
        for (const line of lines) {
            const epicMatch = line.match(/^#+\s*Epic\s+(\d+)[\s:—-]+(.+)$/i);
            if (epicMatch) {
                const id = `epic-${epicMatch[1]}`;
                if (!nodeIds.has(id)) {
                    nodes.push({ id, label: `Epic ${epicMatch[1]}: ${epicMatch[2].trim().replace(/\*\*/g, '')}`, group: 'Epic' });
                    nodeIds.add(id);
                }
            }
        }
    }
    // Locate feature-hierarchy.md
    const candidates = [
        path.join(projectRoot, '_iwish-output', 'feature-hierarchy.md'),
        path.join(projectRoot, '_bmad-output', 'planning-artifacts', 'feature-hierarchy.md'),
    ];
    const hierarchyPath = candidates.find(p => fs.existsSync(p));
    if (!hierarchyPath) {
        return { nodes, edges };
    }
    try {
        const content = fs.readFileSync(hierarchyPath, 'utf8');
        const lines = content.split('\n');
        let currentPortal = null;
        let currentFR = null;
        for (const line of lines) {
            // Portal sections: ## 1. SaaS Dashboard (app.distro.vn) OR ## Portal: Dashboard
            const portalMatch = line.match(/^##\s+(?:Portal[\s:—-]+)?(?:\d+\.\s+)?([^(\n]+)(?:\s+\(|(?:$))/i);
            if (portalMatch && !line.includes('Overview') && !line.includes('Cross-Portal')) {
                const label = portalMatch[1].trim();
                const id = 'portal-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                if (!nodeIds.has(id)) {
                    nodes.push({ id, label: `Portal: ${label}`, group: 'Portal', metadata: { portalName: label } });
                    nodeIds.add(id);
                }
                currentPortal = id;
                continue;
            }
            // Feature matching: - Connect & SSO Redirect (`FR7, FR43`) → `E1/S1.1` [MVP] (Free)
            const featureMatch = line.match(/-\s+(.*?)\s+\(`?(FR[^`]+)`?\)\s*→\s*`?E(\d+)\/S(\d+\.\d+)`?/i);
            if (featureMatch) {
                const featureName = featureMatch[1].trim();
                const frsString = featureMatch[2];
                const epicNum = featureMatch[3];
                const storyNum = featureMatch[4];
                const storyId = `story-${storyNum}`;
                const epicId = `epic-${epicNum}`;
                // Parse FRs
                const frNumbers = frsString.replace(/FR/g, '').split(',').map(s => s.trim());
                for (const num of frNumbers) {
                    if (!num)
                        continue;
                    const frId = `fr-${num}`;
                    if (!nodeIds.has(frId)) {
                        nodes.push({ id: frId, label: `FR${num}`, group: 'FR', metadata: { frNumber: num } });
                        nodeIds.add(frId);
                    }
                    currentFR = frId;
                    if (currentPortal) {
                        edges.push({ from: frId, to: currentPortal, relationship: 'DISPLAYED_ON', label: 'displayed on' });
                    }
                    // Connect Epic to FR directly
                    if (nodeIds.has(epicId)) {
                        edges.push({ from: epicId, to: frId, relationship: 'BELONGS_TO', label: 'implements' });
                        // Also link story to epic
                        edges.push({ from: storyId, to: epicId, relationship: 'BELONGS_TO', label: 'belongs to' });
                    }
                }
                continue;
            }
            // FR references (old format): ### FR01: ...
            const frMatch = line.match(/^(?:###|-)\s*FR[-_]?(\d+)[\s:—-]+(.+)$/i);
            if (frMatch) {
                const num = frMatch[1];
                const title = frMatch[2].trim();
                const id = `fr-${num}`;
                if (!nodeIds.has(id)) {
                    nodes.push({ id, label: `FR${num}: ${title}`, group: 'FR', metadata: { frNumber: num } });
                    nodeIds.add(id);
                }
                currentFR = id;
                if (currentPortal) {
                    edges.push({ from: id, to: currentPortal, relationship: 'DISPLAYED_ON', label: 'displayed on' });
                }
                continue;
            }
            // Epic references within hierarchy (old format)
            const epicMatch = line.match(/^(?:####|-\s+)\s*Epic\s+(\d+)[\s:—-]+(.+)$/i);
            if (epicMatch) {
                const num = epicMatch[1];
                const title = epicMatch[2].trim();
                const id = `epic-${num}`;
                if (!nodeIds.has(id)) {
                    nodes.push({ id, label: `Epic ${num}: ${title}`, group: 'Epic', metadata: { epicNumber: num } });
                    nodeIds.add(id);
                }
                if (currentFR) {
                    edges.push({ from: id, to: currentFR, relationship: 'BELONGS_TO', label: 'belongs to' });
                }
                continue;
            }
            // DataEntity references: [DataEntity: UserProfile] or DataEntity: UserProfile
            const entityMatch = line.match(/(?:\[)?DataEntity[\s:—-]+([^\]\n]+)(?:\])?/i);
            if (entityMatch) {
                const label = entityMatch[1].trim();
                const id = 'entity-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                if (!nodeIds.has(id)) {
                    nodes.push({ id, label: `Entity: ${label}`, group: 'DataEntity', metadata: { entityName: label } });
                    nodeIds.add(id);
                }
                if (currentFR) {
                    edges.push({ from: currentFR, to: id, relationship: 'USES_ENTITY', label: 'uses' });
                }
                continue;
            }
            // Event references: [Event: PaymentCompleted] or Event: PaymentCompleted
            const eventMatch = line.match(/(?:\[)?Event[\s:—-]+([^\]\n]+)(?:\])?/i);
            if (eventMatch) {
                const label = eventMatch[1].trim();
                const id = 'event-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                if (!nodeIds.has(id)) {
                    nodes.push({ id, label: `Event: ${label}`, group: 'Event', metadata: { eventName: label } });
                    nodeIds.add(id);
                }
                continue;
            }
        }
        // Scan story files for Cross-Feature Dependencies
        const storiesDir = path.join(projectRoot, '_iwish-output', 'stories');
        const newStoriesDir = path.join(projectRoot, '_iwish-output', '3. Development', '1. Epic & Story');
        const activeStoriesDir = fs.existsSync(newStoriesDir) ? newStoriesDir : (fs.existsSync(storiesDir) ? storiesDir : null);
        if (activeStoriesDir) {
            const storyFiles = [];
            const walkSync = (dir) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const filepath = path.join(dir, file);
                    if (fs.statSync(filepath).isDirectory()) {
                        walkSync(filepath);
                    }
                    else if (filepath.endsWith('.md')) {
                        storyFiles.push(filepath);
                    }
                }
            };
            walkSync(activeStoriesDir);
            for (const filePath of storyFiles) {
                const storyContent = fs.readFileSync(filePath, 'utf8');
                const storyIdBase = path.basename(filePath, '.md');
                // Add story node if referenced
                const storyTitleMatch = storyContent.match(/^#\s+Story\s+(\d+\.\d+)[\s:—-]+(.+)$/im);
                if (storyTitleMatch) {
                    const sId = `story-${storyTitleMatch[1]}`;
                    if (!nodeIds.has(sId)) {
                        nodes.push({ id: sId, label: `Story ${storyTitleMatch[1]}: ${storyTitleMatch[2].trim()}`, group: 'Story' });
                        nodeIds.add(sId);
                    }
                    // Link to parent epic
                    const epicNum = storyTitleMatch[1].split('.')[0];
                    const epicId = `epic-${epicNum}`;
                    if (nodeIds.has(epicId)) {
                        edges.push({ from: sId, to: epicId, relationship: 'BELONGS_TO', label: 'belongs to' });
                    }
                }
                const sourceId = storyTitleMatch ? `story-${storyTitleMatch[1]}` : storyIdBase;
                // Find cross dependencies section
                const depSectionMatch = storyContent.match(/##[^\n]*Dependencies([^\n]*\n)([\s\S]*?)(?=\n##|\n---|\Z)/i);
                if (depSectionMatch) {
                    const depContent = depSectionMatch[2];
                    const impactsMatches = depContent.matchAll(/(?:IMPACTS|impacts)\s*[:\s]+\s*(?:story[-\s]?)?(\d+\.\d+)/gi);
                    for (const m of impactsMatches) {
                        const targetId = `story-${m[1]}`;
                        edges.push({ from: sourceId, to: targetId, relationship: 'IMPACTS', label: 'impacts', confidence: 0.8 });
                    }
                    const consumesMatches = depContent.matchAll(/(?:CONSUMES|consumes)\s*[:\s]+\s*(?:entity[-\s]?)?([A-Za-z0-9_-]+)/gi);
                    for (const m of consumesMatches) {
                        const entityId = 'entity-' + m[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        edges.push({ from: sourceId, to: entityId, relationship: 'CONSUMES', label: 'consumes' });
                    }
                    const sharedMatches = depContent.matchAll(/(?:SHARED_ENTITIES?|shared_entit(?:y|ies))\s*[:\s]+\s*([A-Za-z0-9_-]+)/gi);
                    for (const m of sharedMatches) {
                        const entityLabel = m[1].trim();
                        const entityId = 'entity-' + entityLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        if (!nodeIds.has(entityId)) {
                            nodes.push({ id: entityId, label: `Entity: ${entityLabel}`, group: 'DataEntity', metadata: { entityName: entityLabel } });
                            nodeIds.add(entityId);
                        }
                        edges.push({ from: sourceId, to: entityId, relationship: 'USES_ENTITY', label: 'shared entity' });
                    }
                }
            }
        }
    }
    catch (error) {
        console.warn('Error extracting feature graph data:', error);
        return { nodes, edges };
    }
    return { nodes, edges };
}
function extractEvolverData(projectRoot) {
    const scriptPath = path.join(projectRoot, '.agent', 'skills', 'iwish-evolver', 'scripts', 'lineage-sync.py');
    if (!fs.existsSync(scriptPath)) {
        const emptyEvolver = {};
        return emptyEvolver;
    }
    try {
        const output = (0, child_process_1.execSync)(`python3 "${scriptPath}" query-all`, {
            encoding: 'utf8',
            env: process.env,
        });
        return JSON.parse(output);
    }
    catch (error) {
        console.warn('Error querying evolver data:', error);
        const emptyEvolverFallback = {};
        return emptyEvolverFallback;
    }
}
function autoRepairSprintStatus(projectRoot) {
    const epicsCandidates = [
        path.join(projectRoot, '_iwish-output', '2. Product Planning', '2.4. epics-and-stories.md'),
        path.join(projectRoot, '_iwish-output', 'epics.md'),
        path.join(projectRoot, '_bmad-output', 'epics.md'),
        path.join(projectRoot, 'docs', 'epics.md')
    ];
    const epicsPath = epicsCandidates.find(p => fs.existsSync(p));
    if (!epicsPath) {
        return;
    }
    const epicsContent = fs.readFileSync(epicsPath, 'utf8');
    const epicsList = [];
    let currentEpic = null;
    const lines = epicsContent.split('\n');
    for (const line of lines) {
        const epicMatch = line.match(/^#+\s*Epic\s+(\d+)[\s:—-]+(.+)$/i);
        if (epicMatch) {
            currentEpic = {
                id: `epic-${epicMatch[1]}`,
                title: epicMatch[2].trim().replace(/\*\*/g, ''),
                status: 'not_started',
                stories: []
            };
            epicsList.push(currentEpic);
            continue;
        }
        const storyMatch = line.match(/^#+\s*Story\s+(\d+\.\d+)[\s:—-]+(.+)$/i);
        if (storyMatch && currentEpic) {
            const storyId = `story-${storyMatch[1]}`;
            let status = 'not_started';
            const storyPath = path.join(projectRoot, '_iwish-output', 'stories', `${storyId}.md`);
            if (fs.existsSync(storyPath)) {
                const content = fs.readFileSync(storyPath, 'utf8');
                const statusMatch = content.match(/sprintStatus:\s*["']?(\w+)["']?/);
                if (statusMatch) {
                    status = statusMatch[1];
                }
            }
            currentEpic.stories.push({
                id: storyId,
                title: storyMatch[2].trim().replace(/\*\*/g, ''),
                status: status
            });
        }
    }
    const devSprintPath = path.join(projectRoot, '_iwish-output', '3. Development', 'sprint-status.yaml');
    const flatSprintPath = path.join(projectRoot, '_iwish-output', 'stories', 'sprint-status.yaml');
    const hasHierarchical = fs.existsSync(path.join(projectRoot, '_iwish-output', '3. Development'));
    const sprintPath = hasHierarchical ? devSprintPath : flatSprintPath;
    let existingData = {};
    if (fs.existsSync(sprintPath)) {
        try {
            const existingYaml = fs.readFileSync(sprintPath, 'utf8');
            existingData = yaml_1.default.parse(existingYaml) || {};
        }
        catch (e) { }
    }
    const outputData = {
        sprint_name: existingData.sprint_name || 'Auto-Repaired Sprint',
        status: existingData.status || 'planning',
        start_date: existingData.start_date || new Date().toISOString().split('T')[0],
        epics: epicsList
    };
    // Preserve existing statuses if possible
    if (Array.isArray(existingData.epics)) {
        for (const newEpic of outputData.epics) {
            const oldEpic = existingData.epics.find((e) => e.id === newEpic.id);
            if (oldEpic) {
                newEpic.status = oldEpic.status || 'not_started';
                for (const newStory of newEpic.stories) {
                    const oldStory = Array.isArray(oldEpic.stories) ? oldEpic.stories.find((s) => s.id === newStory.id) : null;
                    if (oldStory) {
                        newStory.status = (newStory.status && newStory.status !== 'not_started')
                            ? newStory.status
                            : (oldStory.status || 'not_started');
                    }
                }
            }
        }
    }
    const targetDir = path.dirname(sprintPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirpSync(targetDir);
    }
    fs.writeFileSync(sprintPath, yaml_1.default.stringify(outputData));
}
