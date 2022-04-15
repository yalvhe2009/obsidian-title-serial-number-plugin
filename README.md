# Obsidian Title Serial Number Plugin

This plugin adds serial numbers to your markdown title.

![quick start](https://raw.githubusercontent.com/yalvhe2009/obsidian-title-serial-number-plugin/master/assets/quick-start.gif)

Now, This plugin noly provides two commands and their graphical interface for configuration!

- commands:
  - `Set Serial Number For Title`
  - `Clear Serial Number For Title`
- configuration interface：

![configuration interface](https://raw.githubusercontent.com/yalvhe2009/obsidian-title-serial-number-plugin/master/assets/configuration-interface-v0_0_2.png)

## About configration

In version v0.0.2, we changed configration mode. You can active any headline you want, and other headline in you aritcle which not active will not generate serial number.

For example, I acitved H2 and H4.

```markdown
## Hello

#### World

#### Have

## A

#### Good

#### Day
```

When I executed command `Set Serial Number For Title` in above article, I got this:

```markdown
## 1 Hello

#### 1.1 World

#### 1.2 Have

## 2 A

#### 2.1 Good

#### 2.2 Day
```