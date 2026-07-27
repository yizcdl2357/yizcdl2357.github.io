class SQLiteParagraphRepository {
  constructor(db) { this.db = db; }

  create(p) {
    this.db.run("INSERT INTO paragraphs (id,content,author_id,theme,status,submitted_at,review_version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [p.id,p.content,p.authorId,p.theme,p.status,p.submittedAt,p.reviewVersion,p.createdAt,p.updatedAt]);
    this.replaceTags(p.id,p.tags);
    return this.findByIdAny(p.id);
  }

  findById(id) { return this.hydrate(this.db.get("SELECT * FROM paragraphs WHERE id=? AND status='approved'", [id])); }
  findByIdAny(id) { return this.hydrate(this.db.get("SELECT * FROM paragraphs WHERE id=?", [id])); }
  findByUserId(id) { return this.db.all("SELECT * FROM paragraphs WHERE author_id=? ORDER BY submitted_at DESC", [id]).map((r)=>this.hydrate(r)); }
  findNextPending() { return this.hydrate(this.db.get("SELECT * FROM paragraphs WHERE status='pending' ORDER BY submitted_at,id LIMIT 1")); }

  search(keyword="",theme="",tags=[]) {
    const clauses=["status='approved'"]; const params=[];
    if(keyword){clauses.push("content LIKE ?");params.push(`%${keyword}%`);}
    if(theme){clauses.push("theme LIKE ?");params.push(`%${theme}%`);}
    if(tags.length){clauses.push(`id IN (SELECT paragraph_id FROM paragraph_tags WHERE tag_id IN (${tags.map(()=>"?").join(",")}) GROUP BY paragraph_id HAVING COUNT(DISTINCT tag_id)=?)`);params.push(...tags,tags.length);}
    return this.db.all(`SELECT * FROM paragraphs WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`,params).map((r)=>this.hydrate(r));
  }

  updateReview(p,expectedVersion) {
    this.db.run("UPDATE paragraphs SET content=?,theme=?,status=?,review_version=?,reviewed_by=?,reviewed_at=?,rejection_reason=?,updated_at=? WHERE id=? AND review_version=? AND status='pending'",
      [p.content,p.theme,p.status,p.reviewVersion,p.reviewedBy,p.reviewedAt,p.rejectionReason,p.updatedAt,p.id,expectedVersion]);
    const row=this.findByIdAny(p.id);
    if(!row||row.reviewVersion!==p.reviewVersion) { const e=new Error("Review version conflict"); e.code="REVIEW_VERSION_CONFLICT"; throw e; }
    this.replaceTags(p.id,p.tags); return this.findByIdAny(p.id);
  }

  deleteById(id){this.db.run("DELETE FROM paragraph_tags WHERE paragraph_id=?",[id]);this.db.run("DELETE FROM paragraphs WHERE id=?",[id]);}
  replaceTags(id,tags){this.db.run("DELETE FROM paragraph_tags WHERE paragraph_id=?",[id]);for(const tag of tags||[])this.db.run("INSERT OR IGNORE INTO paragraph_tags(paragraph_id,tag_id) VALUES(?,?)",[id,tag]);}
  hydrate(row){if(!row)return null;const tags=this.db.all("SELECT tags.id,tags.name FROM paragraph_tags JOIN tags ON tags.id=paragraph_tags.tag_id WHERE paragraph_id=? ORDER BY tags.rowid",[row.id]);const user=this.db.get("SELECT username FROM users WHERE id=?",[row.author_id]);return{id:row.id,content:row.content,authorId:row.author_id,authorName:user?.username||"系统示例",theme:row.theme,themeName:row.theme,tags:tags.map(t=>t.id),tagNames:tags.map(t=>t.name),status:row.status||"approved",submittedAt:row.submitted_at||row.created_at,reviewVersion:Number(row.review_version||0),reviewedBy:row.reviewed_by||null,reviewedAt:row.reviewed_at||null,rejectionReason:row.rejection_reason||null,createdAt:row.created_at,updatedAt:row.updated_at};}
}
module.exports={SQLiteParagraphRepository};
