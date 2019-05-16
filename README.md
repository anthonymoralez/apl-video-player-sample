## Sample Skill - APL Video Player

This sample skill can be used to create a video skill using the Alexa Presentation Language.


## Prerequisites

* An Alexa Developer Account [sign up here](https://developer.amazon.com/alexa-skills-kit)
* An AWS Account [sign up here](https://aws.amazon.com)
* (Optional) An Amazon Echo Device with a screen (e.g. Amazon Echo Show)


## Setting up a copy of this skill

```javascript
ask new --url https://github.com/anthonymoralez/apl-video-player-sample --name apl-video-player-sample
cd apl-video-player-sample
ask deploy
```

## Adding your own videos
Your videos must be in MP4 format, hosted on a publicly accessible host with an https url. 

In the [/lambda/custom/lib/videoData.json](/lambda/custom/lib/videoData.json) replace the `source.url` with the url of your video. You can also add a title and a thumbnail image.


## The Meetup

This code was presented at the first [SF Alexa Skill Developer and VUI Enthusiast Group meetup](https://www.meetup.com/SF-Alexa-Skill-Developer-and-VUI-Enthusiast-Group/events/259013060)
