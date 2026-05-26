import { supabaseAdmin } from './supabase';

export async function getUserPlan(userId: string): Promise<"free" | "pro" | "creator"> {
  if (!userId) return "free";

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) return "free";

    const { plan, plan_expires_at } = data;
    
    if (!plan || plan === "free") return "free";
    
    // Check expiration
    if (plan_expires_at && new Date(plan_expires_at) < new Date()) {
      return "free";
    }
    
    return plan as "free" | "pro" | "creator";
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return "free";
  }
}

export async function canProcessVideo(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  // Free users cannot process premium videos based on requirement
  if (plan === "free") return false;
  return true;
}
