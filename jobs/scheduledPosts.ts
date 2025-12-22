import db from "../lib/db";

// Function to publish scheduled posts
export const publishScheduledPosts = async () => {
  try {
    const now = new Date();
    const scheduledPosts = await db.post.findMany({
      where: {
        scheduledAt: {
          lte: now,
        },
        published: false,
      },
    });

    for (const post of scheduledPosts) {
      await db.post.update({
        where: { id: post.id },
        data: {
          published: true,
          scheduledAt: null, // Clear scheduledAt after publishing
        },
      });
      console.log(`Published scheduled post: ${post.id} - ${post.title}`);
    }

    if (scheduledPosts.length > 0) {
      console.log(`Published ${scheduledPosts.length} scheduled post(s)`);
    }
  } catch (error) {
    console.error("Error publishing scheduled posts:", error);
  }
};

// Initialize scheduled posts job
export function initScheduledPostsJob(): void {
  // Check for scheduled posts every minute
  setInterval(publishScheduledPosts, 60 * 1000);

  // Publish scheduled posts on server start (non-blocking)
  setImmediate(() => {
    publishScheduledPosts().catch((err) => {
      console.error("Error publishing scheduled posts on startup:", err);
    });
  });
}
