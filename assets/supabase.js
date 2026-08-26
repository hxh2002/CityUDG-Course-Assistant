(function () {
  "use strict";
  const SUPABASE_URL = "https://wdarmhopwtkzuwgwmohg.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYXJtaG9wd3RrenV3Z3dtb2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MjkzOTEsImV4cCI6MjEwMzMwNTM5MX0.wZLuxVab30NoKhJdJ2uSvfM_BFkniT00AJ3Kd3nebCg";

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function getUser() {
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data.user || null;
  }

  async function signInWithGitHub() {
    const { error } = await client.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: location.origin + location.pathname + location.search }
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  function onAuthChange(cb) {
    return client.auth.onAuthStateChange((event, session) => cb(event, session));
  }

  async function listComments(courseCode) {
    const { data, error } = await client
      .from("comments")
      .select("*")
      .eq("course_code", courseCode)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function listAllComments() {
    const { data, error } = await client
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function addComment({ courseCode, rating, content }) {
    const user = await getUser();
    if (!user) { const e = new Error("NOT_LOGGED_IN"); e.code = "NOT_LOGGED_IN"; throw e; }
    const meta = user.user_metadata || {};
    const github = meta.user_name || meta.preferred_username || "";
    const name = meta.user_name || meta.full_name || meta.name || user.email || "GitHub 用户";
    const { data, error } = await client
      .from("comments")
      .insert([{
        course_code: courseCode,
        user_id: user.id,
        github_username: github || null,
        user_name: name,
        rating: rating || 0,
        content: content || ""
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteComment(id) {
    const { error } = await client.from("comments").delete().eq("id", id);
    if (error) throw error;
  }

  function statsFromList(list) {
    const ratings = list.map(c => Number(c.rating)).filter(n => n > 0);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return { count: list.length, ratingCount: ratings.length, avg };
  }

  window.SUPABASE = {
    getUser, signInWithGitHub, signOut, onAuthChange,
    listComments, listAllComments, addComment, deleteComment, statsFromList
  };
})();
