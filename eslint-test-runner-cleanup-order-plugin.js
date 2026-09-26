function getCleanupCall(statement) {
  if (statement.type !== "ExpressionStatement") {
    return null;
  }

  const awaited = statement.expression.type === "AwaitExpression";
  const call = awaited ? statement.expression.argument : statement.expression;

  if (
    call.type !== "CallExpression" ||
    call.callee.type !== "MemberExpression" ||
    call.callee.computed ||
    call.callee.object.type !== "Identifier" ||
    call.callee.property.type !== "Identifier" ||
    !["stopCommand", "teardown"].includes(call.callee.property.name)
  ) {
    return null;
  }

  return {
    runner: call.callee.object.name,
    method: call.callee.property.name,
    awaited,
    node: call,
  };
}

// eslint rule to ensure that test runners are stopped before tearing down their output
// and that both stopCommand() and teardown() are awaited
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Stop test servers before tearing down their output",
    },
    schema: [],
    messages: {
      awaitStop: "call stopCommand() with `await`.",
      awaitTeardown: "call teardown() with `await`.",
      stopFirst: "Call stopCommand() before calling teardown() for this runner.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          !["after", "afterEach"].includes(node.callee.name)
        ) {
          return;
        }

        const callback = node.arguments[0];

        if (callback?.body?.type !== "BlockStatement") {
          return;
        }

        const callsByRunner = new Map();

        for (const [index, statement] of callback.body.body.entries()) {
          const cleanup = getCleanupCall(statement);

          if (cleanup) {
            const calls = callsByRunner.get(cleanup.runner) ?? {};
            calls[cleanup.method] = { ...cleanup, index };
            callsByRunner.set(cleanup.runner, calls);
          }
        }

        for (const { stopCommand, teardown } of callsByRunner.values()) {
          // Build-only tests can use teardown() without a running server.
          if (!stopCommand || !teardown) {
            continue;
          }

          if (!stopCommand.awaited) {
            context.report({ node: stopCommand.node, messageId: "awaitStop" });
          }

          if (!teardown.awaited) {
            context.report({ node: teardown.node, messageId: "awaitTeardown" });
          }

          if (stopCommand.index > teardown.index) {
            context.report({ node: teardown.node, messageId: "stopFirst" });
          }
        }
      },
    };
  },
};
