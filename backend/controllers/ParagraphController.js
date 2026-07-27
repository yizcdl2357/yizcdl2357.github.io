const { readJson, sendJson, getSessionId } = require("./helpers");

class ParagraphController {
  constructor(authService, paragraphService) { this.authService=authService;this.paragraphService=paragraphService; }
  async user(req,res){const user=await this.authService.getCurrentUser(getSessionId(req));if(!user)sendJson(res,401,{ok:false,code:"AUTH_REQUIRED",message:"请先登录"});return user;}
  async createParagraph(req,res){const user=await this.user(req,res);if(!user)return;const b=await readJson(req);const r=await this.paragraphService.createParagraph(user,b.content,b.theme,b.tags||[]);sendJson(res,r.ok?200:400,r);}
  async getParagraph(req,res,id){const p=await this.paragraphService.getParagraphById(id);sendJson(res,p?200:404,p?{ok:true,paragraph:p}:{ok:false,message:"语段不存在"});}
  async listParagraphs(req,res,url){const tags=url.searchParams.get("tags");sendJson(res,200,{ok:true,paragraphs:await this.paragraphService.searchParagraphs(url.searchParams.get("keyword")||"",url.searchParams.get("theme")||"",tags?tags.split(",").filter(Boolean):[])});}
  async listMyParagraphs(req,res){const user=await this.user(req,res);if(!user)return;sendJson(res,200,{ok:true,paragraphs:await this.paragraphService.getParagraphsByUser(user.id)});}
  async deleteParagraph(req,res,id){const user=await this.user(req,res);if(!user)return;const r=await this.paragraphService.deleteParagraph(user,id);const status=r.ok?200:r.message==="已拒绝语段需要保留"?409:403;sendJson(res,status,r);}
  async nextReview(req,res){const user=await this.user(req,res);if(!user)return;const r=await this.paragraphService.claimNext(user);sendJson(res,r.ok?200:403,r);}
  async review(req,res,id,action){const user=await this.user(req,res);if(!user)return;const r=await this.paragraphService.review(user,id,action,await readJson(req));sendJson(res,r.ok?200:r.code==="ADMIN_REQUIRED"?403:r.code?.includes("CONFLICT")||r.code==="INVALID_STATUS_TRANSITION"?409:400,r);}
}
module.exports={ParagraphController};
