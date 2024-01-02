// 这是一个node脚本，会获得一个参数，这个参数是一个文件夹的路径，然后需要遍历这个文件夹下的所有文件，找到所有的less文件，然后读取less文件的内容，拿到文件内容字符串我再进行一些特殊处理，横线转驼峰，并排除一些库的样式

const fs = require("fs");

function hyphenToCamelCase(s) {
  return s.replace(/-(.)/g, function (_, character) {
    return character.toUpperCase();
  });
}

function convertClassName(className) {
  if (className.startsWith("ant") || className.startsWith("igloo")) {
    return className;
  }
  return hyphenToCamelCase(className);
}

function format(text) {
  try {
    return text.replace(/\.([\w-]+)/g, (_, p1) => {
      return "." + convertClassName(p1);
    });
  } catch (error) {
    console.error(`格式化文本时出错: ${error}`);
    throw error;
  }
}

function run(path) {
  try {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
      const filePath = `${path}/${file}`;
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        run(filePath);
      } else if (stat.isFile() && /\.less$/.test(file)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const afterFormatContent = format(content);
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
} catch (error) {
  console.error(`运行脚本时出错: ${error}`);
}
