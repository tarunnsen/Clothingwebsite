function runInBackground(task) {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((err) => {
        console.error("Background task failed:", err?.message || err);
      });
  });
}

module.exports = { runInBackground };