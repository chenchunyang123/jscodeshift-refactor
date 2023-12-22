import { API, FileInfo } from "jscodeshift";

export default (fileInfo: FileInfo, api: API) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  const windowGtagCollection = root.find(j.CallExpression, {
    callee: {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: "window",
      },
      property: {
        type: "Identifier",
        name: "gtag",
      },
    },
  });

  const windowGtagOptionalCollection = root.find(j.OptionalCallExpression, {
    callee: {
      type: "OptionalMemberExpression",
      object: {
        type: "Identifier",
        name: "window",
      },
      property: {
        type: "Identifier",
        name: "gtag",
      },
    },
  });

  if (
    windowGtagCollection.length === 0 &&
    windowGtagOptionalCollection.length === 0
  ) {
    return root.toSource();
  }

  // 找到代码里的window.gtag函数调用，并且替换成safeGtag函数调用
  windowGtagCollection.replaceWith(({ node }) => {
    return j.callExpression(j.identifier("safeGtag"), node.arguments);
  });
  windowGtagOptionalCollection.replaceWith(({ node }) => {
    return j.callExpression(j.identifier("safeGtag"), node.arguments);
  });

  // 现在需要判断代码引入中是否已经导入了igloo-ips-tools,如果已经导入，则再判断是否导入了safeGtag，如果没有导入，则需要导入
  // 如果没有导入，则需要导入igloo-ips-tools，并且导出safeGtag
  // 如果已经导入了igloo-ips-tools中的safeGtag，则不需要再次导入
  const hasImportTools =
    root
      .find(j.ImportDeclaration, {
        source: {
          type: "StringLiteral",
          value: "igloo-ips-tools",
        },
      })
      .size() > 0;

  if (hasImportTools) {
    // 已经导入了igloo-ips-tools，则需要判断是否导入了safeGtag
    const hasImportSafeGtag =
      root
        .find(j.ImportSpecifier, {
          imported: {
            type: "Identifier",
            name: "safeGtag",
          },
        })
        .size() > 0;

    if (!hasImportSafeGtag) {
      // 没有导入safeGtag，则需要导入
      root
        .find(j.ImportDeclaration, {
          source: {
            type: "StringLiteral",
            value: "igloo-ips-tools",
          },
        })
        .forEach((path) => {
          path.node.specifiers.push(
            j.importSpecifier(j.identifier("safeGtag"))
          );
        });
    }
  } else {
    // 没有导入igloo-ips-tools，则需要导入
    root
      .find(j.Program)
      .get("body", 0)
      .insertBefore(
        j.importDeclaration(
          [j.importSpecifier(j.identifier("safeGtag"))],
          j.stringLiteral("igloo-ips-tools")
        )
      );
  }

  return root.toSource();
};
