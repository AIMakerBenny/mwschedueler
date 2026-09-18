//go:build windows

package main

import (
	"bytes"
	"crypto/sha256"
	_ "embed"
	"fmt"
	"image"
	"image/png"
	"syscall"
	"unsafe"
)

const (
	expectedIntroImageWidth  = 2048
	expectedIntroImageHeight = 1152
	expectedIntroImageBytes  = 2179918
	expectedIntroImageSHA256 = "6e5ccb04767b7730b848b0ef4e255f357eda3b2c62acedec23f527e55ae5f1e9"

	introBI_RGB          = 0
	introDIBRGBColors    = 0
	introSRCCOPY         = 0x00CC0020
	introBLACKNESS       = 0x00000042
	introStretchHalftone = 4
	introBkTransparent   = 1
	introDTCenter        = 0x00000001
	introDTVCenter       = 0x00000004
	introDTSingleLine    = 0x00000020
	introFontSemibold    = 600
	introACSrcOver       = 0x00
)

//go:embed assets/mawang-intro.png
var embeddedIntroPNG []byte

type introBitmapInfoHeader struct {
	Size          uint32
	Width         int32
	Height        int32
	Planes        uint16
	BitCount      uint16
	Compression   uint32
	SizeImage     uint32
	XPelsPerMeter int32
	YPelsPerMeter int32
	ClrUsed       uint32
	ClrImportant  uint32
}

type introBitmapInfo struct {
	Header introBitmapInfoHeader
	Colors [1]uint32
}

type introSurface struct {
	dc        uintptr
	bitmap    uintptr
	oldBitmap uintptr
	width     int
	height    int
}

type introRenderer struct {
	width      int
	height     int
	frame      introSurface
	imageLayer introSurface
	mainFont   uintptr
	subFont    uintptr
}

var (
	introGDI32                   = syscall.NewLazyDLL("gdi32.dll")
	introMSImg32                 = syscall.NewLazyDLL("msimg32.dll")
	introCreateCompatibleDC      = introGDI32.NewProc("CreateCompatibleDC")
	introDeleteDC                = introGDI32.NewProc("DeleteDC")
	introCreateDIBSection        = introGDI32.NewProc("CreateDIBSection")
	introSelectObject            = introGDI32.NewProc("SelectObject")
	introDeleteObject            = introGDI32.NewProc("DeleteObject")
	introPatBlt                  = introGDI32.NewProc("PatBlt")
	introBitBlt                  = introGDI32.NewProc("BitBlt")
	introStretchDIBits           = introGDI32.NewProc("StretchDIBits")
	introSetStretchBltMode       = introGDI32.NewProc("SetStretchBltMode")
	introSetBkMode               = introGDI32.NewProc("SetBkMode")
	introSetTextColor            = introGDI32.NewProc("SetTextColor")
	introCreateFont              = introGDI32.NewProc("CreateFontW")
	introDrawText                = introUser32.NewProc("DrawTextW")
	introAlphaBlend              = introMSImg32.NewProc("AlphaBlend")
)

func createIntroSurface(width, height int) (introSurface, error) {
	if width <= 0 || height <= 0 {
		return introSurface{}, fmt.Errorf("invalid surface size %dx%d", width, height)
	}
	dc, _, err := introCreateCompatibleDC.Call(0)
	if dc == 0 {
		return introSurface{}, fmt.Errorf("CreateCompatibleDC failed: %v", err)
	}
	bmi := introBitmapInfo{Header: introBitmapInfoHeader{
		Size:        uint32(unsafe.Sizeof(introBitmapInfoHeader{})),
		Width:       int32(width),
		Height:      -int32(height),
		Planes:      1,
		BitCount:    32,
		Compression: introBI_RGB,
	}}
	var bits uintptr
	bitmap, _, dibErr := introCreateDIBSection.Call(
		dc,
		uintptr(unsafe.Pointer(&bmi)),
		introDIBRGBColors,
		uintptr(unsafe.Pointer(&bits)),
		0,
		0,
	)
	if bitmap == 0 || bits == 0 {
		introDeleteDC.Call(dc)
		return introSurface{}, fmt.Errorf("CreateDIBSection failed: %v", dibErr)
	}
	old, _, selectErr := introSelectObject.Call(dc, bitmap)
	if old == 0 || old == ^uintptr(0) {
		introDeleteObject.Call(bitmap)
		introDeleteDC.Call(dc)
		return introSurface{}, fmt.Errorf("SelectObject for DIB failed: %v", selectErr)
	}
	return introSurface{dc: dc, bitmap: bitmap, oldBitmap: old, width: width, height: height}, nil
}

func (s *introSurface) close() {
	if s == nil {
		return
	}
	if s.dc != 0 && s.oldBitmap != 0 && s.oldBitmap != ^uintptr(0) {
		introSelectObject.Call(s.dc, s.oldBitmap)
	}
	if s.bitmap != 0 {
		introDeleteObject.Call(s.bitmap)
	}
	if s.dc != 0 {
		introDeleteDC.Call(s.dc)
	}
	*s = introSurface{}
}

func validateAndDecodeIntroImage() (image.Image, error) {
	if len(embeddedIntroPNG) != expectedIntroImageBytes {
		return nil, fmt.Errorf("intro PNG size mismatch: got=%d want=%d", len(embeddedIntroPNG), expectedIntroImageBytes)
	}
	sum := fmt.Sprintf("%x", sha256.Sum256(embeddedIntroPNG))
	if sum != expectedIntroImageSHA256 {
		return nil, fmt.Errorf("intro PNG SHA-256 mismatch: got=%s want=%s", sum, expectedIntroImageSHA256)
	}
	img, err := png.Decode(bytes.NewReader(embeddedIntroPNG))
	if err != nil {
		return nil, fmt.Errorf("intro PNG decode failed: %w", err)
	}
	b := img.Bounds()
	if b.Dx() != expectedIntroImageWidth || b.Dy() != expectedIntroImageHeight {
		return nil, fmt.Errorf("intro PNG dimensions mismatch: got=%dx%d want=%dx%d", b.Dx(), b.Dy(), expectedIntroImageWidth, expectedIntroImageHeight)
	}
	logDesktop("intro asset verified: bytes=%d width=%d height=%d sha256=%s", len(embeddedIntroPNG), b.Dx(), b.Dy(), sum)
	return img, nil
}

func introImageBGRA(img image.Image) ([]byte, int, int) {
	b := img.Bounds()
	width, height := b.Dx(), b.Dy()
	pixels := make([]byte, width*height*4)
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			r, g, bl, a := img.At(b.Min.X+x, b.Min.Y+y).RGBA()
			i := (y*width + x) * 4
			if a == 0 {
				pixels[i] = 0
				pixels[i+1] = 0
				pixels[i+2] = 0
				pixels[i+3] = 0
				continue
			}
			pixels[i] = byte(bl >> 8)
			pixels[i+1] = byte(g >> 8)
			pixels[i+2] = byte(r >> 8)
			pixels[i+3] = byte(a >> 8)
		}
	}
	return pixels, width, height
}

func fitIntroImage(screenW, screenH, imageW, imageH int) (x, y, width, height int) {
	if screenW <= 0 || screenH <= 0 || imageW <= 0 || imageH <= 0 {
		return 0, 0, 0, 0
	}
	imageAR := float64(imageW) / float64(imageH)
	screenAR := float64(screenW) / float64(screenH)
	if screenAR > imageAR {
		height = screenH
		width = int(float64(height)*imageAR + 0.5)
		x = (screenW - width) / 2
		y = 0
	} else {
		width = screenW
		height = int(float64(width)/imageAR + 0.5)
		x = 0
		y = (screenH - height) / 2
	}
	return
}

func createIntroFont(height int, face string) (uintptr, error) {
	facePtr, err := syscall.UTF16PtrFromString(face)
	if err != nil {
		return 0, err
	}
	font, _, callErr := introCreateFont.Call(
		uintptr(int32(-height)),
		0, 0, 0,
		introFontSemibold,
		0, 0, 0,
		1,
		0, 0, 5, 0,
		uintptr(unsafe.Pointer(facePtr)),
	)
	if font == 0 {
		return 0, fmt.Errorf("CreateFontW %s failed: %v", face, callErr)
	}
	return font, nil
}

func newIntroRenderer(width, height int) (*introRenderer, error) {
	frame, err := createIntroSurface(width, height)
	if err != nil {
		return nil, err
	}
	imageLayer, err := createIntroSurface(width, height)
	if err != nil {
		frame.close()
		return nil, err
	}
	r := &introRenderer{width: width, height: height, frame: frame, imageLayer: imageLayer}

	if ok, _, patErr := introPatBlt.Call(r.imageLayer.dc, 0, 0, uintptr(width), uintptr(height), introBLACKNESS); ok == 0 {
		r.close()
		return nil, fmt.Errorf("PatBlt image layer failed: %v", patErr)
	}

	img, assetErr := validateAndDecodeIntroImage()
	if assetErr == nil {
		pixels, imageW, imageH := introImageBGRA(img)
		x, y, drawW, drawH := fitIntroImage(width, height, imageW, imageH)
		if drawW <= 0 || drawH <= 0 {
			assetErr = fmt.Errorf("invalid fitted intro image rectangle")
		} else {
			introSetStretchBltMode.Call(r.imageLayer.dc, introStretchHalftone)
			bmi := introBitmapInfo{Header: introBitmapInfoHeader{
				Size:        uint32(unsafe.Sizeof(introBitmapInfoHeader{})),
				Width:       int32(imageW),
				Height:      -int32(imageH),
				Planes:      1,
				BitCount:    32,
				Compression: introBI_RGB,
			}}
			ret, _, stretchErr := introStretchDIBits.Call(
				r.imageLayer.dc,
				uintptr(x), uintptr(y), uintptr(drawW), uintptr(drawH),
				0, 0, uintptr(imageW), uintptr(imageH),
				uintptr(unsafe.Pointer(&pixels[0])),
				uintptr(unsafe.Pointer(&bmi)),
				introDIBRGBColors,
				introSRCCOPY,
			)
			if ret == 0 || ret == ^uintptr(0) {
				assetErr = fmt.Errorf("StretchDIBits for intro image failed: %v", stretchErr)
			}
		}
	}

	mainHeight := height / 10
	if mainHeight < 56 {
		mainHeight = 56
	}
	if mainHeight > 116 {
		mainHeight = 116
	}
	subHeight := height / 30
	if subHeight < 20 {
		subHeight = 20
	}
	if subHeight > 42 {
		subHeight = 42
	}
	r.mainFont, err = createIntroFont(mainHeight, "Segoe UI")
	if err != nil {
		if assetErr == nil {
			assetErr = err
		} else {
			logDesktop("intro main font creation failed: %v", err)
		}
	}
	r.subFont, err = createIntroFont(subHeight, "Malgun Gothic")
	if err != nil {
		if assetErr == nil {
			assetErr = err
		} else {
			logDesktop("intro Korean font creation failed: %v", err)
		}
	}
	return r, assetErr
}

func (r *introRenderer) drawTextLine(text string, font uintptr, top, bottom int, alpha byte) error {
	if font == 0 || alpha == 0 {
		return nil
	}
	old, _, err := introSelectObject.Call(r.frame.dc, font)
	if old == 0 || old == ^uintptr(0) {
		return fmt.Errorf("SelectObject font failed: %v", err)
	}
	defer introSelectObject.Call(r.frame.dc, old)

	introSetBkMode.Call(r.frame.dc, introBkTransparent)
	v := uintptr(alpha)
	color := v | v<<8 | v<<16
	introSetTextColor.Call(r.frame.dc, color)
	ptr, convErr := syscall.UTF16PtrFromString(text)
	if convErr != nil {
		return convErr
	}
	rc := rect{Left: 0, Top: int32(top), Right: int32(r.width), Bottom: int32(bottom)}
	ret, _, drawErr := introDrawText.Call(
		r.frame.dc,
		uintptr(unsafe.Pointer(ptr)),
		^uintptr(0),
		uintptr(unsafe.Pointer(&rc)),
		introDTCenter|introDTVCenter|introDTSingleLine,
	)
	if ret == 0 {
		return fmt.Errorf("DrawTextW failed: %v", drawErr)
	}
	return nil
}

func (r *introRenderer) present(targetDC uintptr, photoAlpha, titleAlpha byte) error {
	if r == nil || targetDC == 0 || r.frame.dc == 0 {
		return fmt.Errorf("invalid intro renderer target")
	}
	if ok, _, err := introPatBlt.Call(r.frame.dc, 0, 0, uintptr(r.width), uintptr(r.height), introBLACKNESS); ok == 0 {
		return fmt.Errorf("PatBlt frame failed: %v", err)
	}

	if photoAlpha > 0 && r.imageLayer.dc != 0 {
		blend := uintptr(introACSrcOver) | uintptr(photoAlpha)<<16
		if ok, _, err := introAlphaBlend.Call(
			r.frame.dc, 0, 0, uintptr(r.width), uintptr(r.height),
			r.imageLayer.dc, 0, 0, uintptr(r.width), uintptr(r.height),
			blend,
		); ok == 0 {
			return fmt.Errorf("AlphaBlend failed: %v", err)
		}
	}

	if titleAlpha > 0 {
		mainTop := r.height/2 - r.height/11
		mainBottom := r.height/2 + r.height/26
		subTop := r.height/2 + r.height/14
		subBottom := r.height/2 + r.height/6
		if err := r.drawTextLine("Mawang Scheduler", r.mainFont, mainTop, mainBottom, titleAlpha); err != nil {
			return err
		}
		if err := r.drawTextLine("마왕스케줄러", r.subFont, subTop, subBottom, titleAlpha); err != nil {
			return err
		}
	}

	if ok, _, err := introBitBlt.Call(
		targetDC, 0, 0, uintptr(r.width), uintptr(r.height),
		r.frame.dc, 0, 0, introSRCCOPY,
	); ok == 0 {
		return fmt.Errorf("BitBlt present failed: %v", err)
	}
	return nil
}

func (r *introRenderer) close() {
	if r == nil {
		return
	}
	if r.mainFont != 0 {
		introDeleteObject.Call(r.mainFont)
		r.mainFont = 0
	}
	if r.subFont != 0 {
		introDeleteObject.Call(r.subFont)
		r.subFont = 0
	}
	r.imageLayer.close()
	r.frame.close()
}
