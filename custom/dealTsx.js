// 这是一个node脚本，会获得一个参数，这个参数是一个文件夹的路径，然后需要遍历这个文件夹下的所有文件，找到所有的tsx文件，然后读取tsx文件的内容，拿到文件内容字符串我再进行一些特殊处理，横线转驼峰，并使用css-module

const fs = require("fs");
const chalk = require("chalk");

// 记录文件中有函数方法的样式名的文件路径
const filesWithFunctionClassName = [];

function format(text, filePath) {
    if (text?.includes("className={")) {
      console.log(text)
      console.log(filePath)
    filesWithFunctionClassName.push(filePath);
  }
  return text.replace(/className=["']([^"']*)["']/g, function (match, p1) {
    // 将带横杠的类名分割为各部分
    const parts = p1.split("-");

    // 将各部分转换为驼峰式
    const camelCaseParts = parts.map((part, index) => {
      if (index !== 0) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
      return part;
    });

    // 重新组合各部分为一个驼峰式类名
    const camelCaseClass = camelCaseParts.join("");

    // 将原先的类名替换为驼峰式类名
    return `className={styles.${camelCaseClass}}`;
  });
}

function run(path) {
  try {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
      const filePath = `${path}/${file}`;
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        run(filePath);
      } else if (stat.isFile() && /\.tsx$/.test(file)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const afterFormatContent = format(content, filePath);
        fs.writeFileSync(filePath, afterFormatContent);
      }
    });
  } catch (error) {
    console.error(`处理文件夹 ${path} 时出错: ${error}`);
  }
}

// 运行入口
try {
  run(process.argv[2]);
  // 有需要手动处理的文件，进行提示
  if (filesWithFunctionClassName.length) {
    console.log(
      chalk.yellow(
        `以下文件路径中，包含针对样式名的函数方法，可以在具体文件中搜索className={，并手动处理：\n${filesWithFunctionClassName.join(
          "\n"
        )}`
      )
    );
  }
} catch (error) {
  console.error(`运行脚本时出错: ${error}`);
}
