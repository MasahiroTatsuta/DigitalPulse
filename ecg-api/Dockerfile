# 1. ビルド用の環境 (Java 21 + Maven)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# 依存関係をコピーしてビルド
COPY . .
RUN mvn clean package -DskipTests

# 2. 実行用の軽量環境
FROM eclipse-temurin:21-jre
WORKDIR /app
# ビルドした成果物（JARファイル）をコピー
COPY --from=build /app/target/*.jar app.jar

# 実行コマンド
ENTRYPOINT ["java", "-jar", "app.jar"]